import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { useFirebase } from '../context/FirebaseContext';
import { COMMON_RATION_PACK, getDefaultDateForMonth } from '../i18n/dictionary';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  type CategorySummary,
  type ExpenseCategory,
  type ExpenseEntry,
  type ExpenseWithRunningBalance,
  FIELD_LIMITS,
  type GroceryItem,
  type GroceryUnit,
  type MonthlyBudget,
  type PaymentMethod,
} from '../types/expense';

function clampNumber(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.min(max, Math.max(min, val));
}

function sanitizeStr(val: string, maxLen: number): string {
  return val.trim().slice(0, maxLen);
}

export function useTrackerData(selectedMonth: string) {
  const { user, profileReady } = useFirebase();
  const [monthsMap, setMonthsMap] = useState<Record<string, MonthlyBudget>>({});
  const [allExpenses, setAllExpenses] = useState<ExpenseEntry[]>([]);
  const [allGroceries, setAllGroceries] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profileReady) {
      setMonthsMap({});
      setAllExpenses([]);
      setAllGroceries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let monthsLoaded = false;
    let expensesLoaded = false;
    let groceriesLoaded = false;

    const checkReady = () => {
      if (monthsLoaded && expensesLoaded && groceriesLoaded) {
        setLoading(false);
      }
    };

    const monthsPath = `users/${user.uid}/months`;
    const monthsQuery = query(
      collection(db, 'users', user.uid, 'months'),
      where('userId', '==', user.uid),
    );
    const unsubMonths = onSnapshot(
      monthsQuery,
      (snapshot) => {
        const next: Record<string, MonthlyBudget> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Omit<MonthlyBudget, 'id'>;
          next[docSnap.id] = { id: docSnap.id, ...data };
        });
        setMonthsMap(next);
        monthsLoaded = true;
        checkReady();
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, monthsPath);
      },
    );

    const expensesPath = `users/${user.uid}/expenses`;
    const expensesQuery = query(
      collection(db, 'users', user.uid, 'expenses'),
      where('userId', '==', user.uid),
    );
    const unsubExpenses = onSnapshot(
      expensesQuery,
      (snapshot) => {
        const list: ExpenseEntry[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Omit<ExpenseEntry, 'id'>;
          list.push({ id: docSnap.id, ...data });
        });
        setAllExpenses(list);
        expensesLoaded = true;
        checkReady();
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, expensesPath);
      },
    );

    const groceriesPath = `users/${user.uid}/groceries`;
    const groceriesQuery = query(
      collection(db, 'users', user.uid, 'groceries'),
      where('userId', '==', user.uid),
    );
    const unsubGroceries = onSnapshot(
      groceriesQuery,
      (snapshot) => {
        const list: GroceryItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Omit<GroceryItem, 'id'>;
          list.push({ id: docSnap.id, ...data });
        });
        setAllGroceries(list);
        groceriesLoaded = true;
        checkReady();
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, groceriesPath);
      },
    );

    return () => {
      unsubMonths();
      unsubExpenses();
      unsubGroceries();
    };
  }, [user, profileReady]);

  const currentMonthBudget = monthsMap[selectedMonth] || null;
  const salary = currentMonthBudget?.salary ?? 0;
  const budgetNote = currentMonthBudget?.budgetNote ?? '';

  const monthExpenses = useMemo(
    () => allExpenses.filter((e) => e.monthKey === selectedMonth),
    [allExpenses, selectedMonth],
  );

  const monthGroceries = useMemo(
    () =>
      allGroceries
        .filter((g) => g.monthKey === selectedMonth)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allGroceries, selectedMonth],
  );

  // Chronological order (oldest -> newest) for accurate running balance after each entry
  const expensesWithBalance = useMemo<ExpenseWithRunningBalance[]>(() => {
    const chronological = [...monthExpenses].sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      const aSec = a.createdAt?.seconds ?? 0;
      const bSec = b.createdAt?.seconds ?? 0;
      return aSec - bSec;
    });

    let running = 0;
    return chronological.map((entry) => {
      running += entry.amount;
      return {
        ...entry,
        runningSpent: running,
        balanceAfter: salary - running,
      };
    });
  }, [monthExpenses, salary]);

  const totalSpent = useMemo(
    () => monthExpenses.reduce((sum, e) => sum + e.amount, 0),
    [monthExpenses],
  );

  const remainingBalance = salary - totalSpent;
  const budgetUsedPercent = salary > 0 ? Math.min(100, Math.round((totalSpent / salary) * 100)) : 0;

  const groceryExpenseTotal = useMemo(
    () =>
      monthExpenses
        .filter((e) => e.category === 'groceries')
        .reduce((sum, e) => sum + e.amount, 0),
    [monthExpenses],
  );

  const uniqueDaysCount = useMemo(() => {
    const days = new Set(monthExpenses.map((e) => e.date));
    return days.size || 1;
  }, [monthExpenses]);

  const dailyAverageSpend = totalSpent > 0 ? Math.round(totalSpent / uniqueDaysCount) : 0;

  const categorySummaries = useMemo<CategorySummary[]>(() => {
    const totals = new Map<ExpenseCategory, { total: number; count: number }>();
    const categories: ExpenseCategory[] = [
      'groceries',
      'utilities',
      'transport',
      'dining',
      'health',
      'education',
      'shopping',
      'other',
    ];
    categories.forEach((cat) => totals.set(cat, { total: 0, count: 0 }));

    monthExpenses.forEach((entry) => {
      const current = totals.get(entry.category) || { total: 0, count: 0 };
      totals.set(entry.category, {
        total: current.total + entry.amount,
        count: current.count + 1,
      });
    });

    return categories
      .map((category) => {
        const stat = totals.get(category) || { total: 0, count: 0 };
        return {
          category,
          total: stat.total,
          count: stat.count,
          percentOfSpent: totalSpent > 0 ? Math.round((stat.total / totalSpent) * 100) : 0,
          percentOfSalary: salary > 0 ? Math.round((stat.total / salary) * 100) : 0,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [monthExpenses, totalSpent, salary]);

  const paymentMethodTotals = useMemo(() => {
    const map: Record<PaymentMethod, number> = { cash: 0, bank: 0, wallet: 0 };
    monthExpenses.forEach((e) => {
      map[e.paymentMethod] = (map[e.paymentMethod] || 0) + e.amount;
    });
    return map;
  }, [monthExpenses]);

  const groceryStats = useMemo(() => {
    const totalItems = monthGroceries.length;
    const purchasedItems = monthGroceries.filter((g) => g.purchased).length;
    const totalEstimatedCost = monthGroceries.reduce((sum, g) => sum + (g.unitPrice || 0), 0);
    const purchasedCost = monthGroceries
      .filter((g) => g.purchased)
      .reduce((sum, g) => sum + (g.unitPrice || 0), 0);
    const totalConsumptionRatio =
      totalItems > 0
        ? Math.round(
            (monthGroceries.reduce((sum, g) => {
              if (g.plannedQty <= 0) return sum;
              return sum + Math.min(1, g.consumedQty / g.plannedQty);
            }, 0) /
              totalItems) *
              100,
          )
        : 0;
    const lowOrFinishedCount = monthGroceries.filter(
      (g) => g.plannedQty > 0 && g.consumedQty / g.plannedQty >= 0.8,
    ).length;

    return {
      totalItems,
      purchasedItems,
      totalEstimatedCost,
      purchasedCost,
      totalConsumptionRatio,
      lowOrFinishedCount,
    };
  }, [monthGroceries]);

  // Mutations
  const saveMonthlySalary = useCallback(
    async (newSalary: number, note: string) => {
      if (!user) return;
      const cleanSalary = clampNumber(Math.round(newSalary * 100) / 100, 0, FIELD_LIMITS.MAX_AMOUNT);
      const cleanNote = sanitizeStr(note, FIELD_LIMITS.BUDGET_NOTE_MAX);
      const monthPath = `users/${user.uid}/months/${selectedMonth}`;
      const monthRef = doc(db, 'users', user.uid, 'months', selectedMonth);

      try {
        if (monthsMap[selectedMonth]) {
          await updateDoc(monthRef, {
            salary: cleanSalary,
            budgetNote: cleanNote,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(monthRef, {
            userId: user.uid,
            monthKey: selectedMonth,
            salary: cleanSalary,
            budgetNote: cleanNote,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, monthPath);
      }
    },
    [user, selectedMonth, monthsMap],
  );

  const addExpense = useCallback(
    async (input: {
      title: string;
      amount: number;
      category: ExpenseCategory;
      date: string;
      paymentMethod: PaymentMethod;
      note: string;
      groceryItemId?: string;
    }) => {
      if (!user) return;
      const cleanTitle = sanitizeStr(input.title, FIELD_LIMITS.EXPENSE_TITLE_MAX);
      if (!cleanTitle) return;
      const cleanAmount = clampNumber(
        Math.round(input.amount * 100) / 100,
        1,
        FIELD_LIMITS.MAX_AMOUNT,
      );
      const validDate = /^\d{4}-\d{2}-\d{2}$/.test(input.date)
        ? input.date
        : getDefaultDateForMonth(selectedMonth);
      const derivedMonthKey = validDate.slice(0, 7);
      const cleanNote = sanitizeStr(input.note, FIELD_LIMITS.EXPENSE_NOTE_MAX);

      const expensesPath = `users/${user.uid}/expenses`;
      const payload: Record<string, unknown> = {
        userId: user.uid,
        monthKey: derivedMonthKey,
        title: cleanTitle,
        amount: cleanAmount,
        category: input.category,
        date: validDate,
        paymentMethod: input.paymentMethod,
        note: cleanNote,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (input.groceryItemId) {
        payload.groceryItemId = input.groceryItemId.slice(0, 128);
      }

      try {
        await addDoc(collection(db, 'users', user.uid, 'expenses'), payload);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, expensesPath);
      }
    },
    [user, selectedMonth],
  );

  const updateExpense = useCallback(
    async (
      expenseId: string,
      input: {
        title: string;
        amount: number;
        category: ExpenseCategory;
        date: string;
        paymentMethod: PaymentMethod;
        note: string;
      },
    ) => {
      if (!user) return;
      const cleanTitle = sanitizeStr(input.title, FIELD_LIMITS.EXPENSE_TITLE_MAX);
      if (!cleanTitle) return;
      const cleanAmount = clampNumber(
        Math.round(input.amount * 100) / 100,
        1,
        FIELD_LIMITS.MAX_AMOUNT,
      );
      const validDate = /^\d{4}-\d{2}-\d{2}$/.test(input.date)
        ? input.date
        : getDefaultDateForMonth(selectedMonth);
      const derivedMonthKey = validDate.slice(0, 7);
      const cleanNote = sanitizeStr(input.note, FIELD_LIMITS.EXPENSE_NOTE_MAX);

      const expensePath = `users/${user.uid}/expenses/${expenseId}`;
      try {
        await updateDoc(doc(db, 'users', user.uid, 'expenses', expenseId), {
          monthKey: derivedMonthKey,
          title: cleanTitle,
          amount: cleanAmount,
          category: input.category,
          date: validDate,
          paymentMethod: input.paymentMethod,
          note: cleanNote,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, expensePath);
      }
    },
    [user, selectedMonth],
  );

  const deleteExpense = useCallback(
    async (expenseId: string) => {
      if (!user) return;
      const expensePath = `users/${user.uid}/expenses/${expenseId}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'expenses', expenseId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, expensePath);
      }
    },
    [user],
  );

  const addGroceryItem = useCallback(
    async (input: {
      name: string;
      unit: GroceryUnit;
      plannedQty: number;
      consumedQty: number;
      unitPrice: number;
      purchased: boolean;
      note: string;
    }) => {
      if (!user) return;
      const cleanName = sanitizeStr(input.name, FIELD_LIMITS.GROCERY_NAME_MAX);
      if (!cleanName) return;

      const groceriesPath = `users/${user.uid}/groceries`;
      try {
        await addDoc(collection(db, 'users', user.uid, 'groceries'), {
          userId: user.uid,
          monthKey: selectedMonth,
          name: cleanName,
          unit: input.unit,
          plannedQty: clampNumber(input.plannedQty, 0, FIELD_LIMITS.MAX_QTY),
          consumedQty: clampNumber(input.consumedQty, 0, FIELD_LIMITS.MAX_QTY),
          unitPrice: clampNumber(input.unitPrice, 0, FIELD_LIMITS.MAX_PRICE),
          purchased: Boolean(input.purchased),
          note: sanitizeStr(input.note, FIELD_LIMITS.GROCERY_NOTE_MAX),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, groceriesPath);
      }
    },
    [user, selectedMonth],
  );

  const updateGroceryItem = useCallback(
    async (
      groceryId: string,
      updates: Partial<{
        name: string;
        unit: GroceryUnit;
        plannedQty: number;
        consumedQty: number;
        unitPrice: number;
        purchased: boolean;
        note: string;
      }>,
    ) => {
      if (!user) return;
      const groceryPath = `users/${user.uid}/groceries/${groceryId}`;
      const payload: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };

      if (updates.name !== undefined) {
        const clean = sanitizeStr(updates.name, FIELD_LIMITS.GROCERY_NAME_MAX);
        if (!clean) return;
        payload.name = clean;
      }
      if (updates.unit !== undefined) payload.unit = updates.unit;
      if (updates.plannedQty !== undefined) {
        payload.plannedQty = clampNumber(updates.plannedQty, 0, FIELD_LIMITS.MAX_QTY);
      }
      if (updates.consumedQty !== undefined) {
        payload.consumedQty = clampNumber(updates.consumedQty, 0, FIELD_LIMITS.MAX_QTY);
      }
      if (updates.unitPrice !== undefined) {
        payload.unitPrice = clampNumber(updates.unitPrice, 0, FIELD_LIMITS.MAX_PRICE);
      }
      if (updates.purchased !== undefined) {
        payload.purchased = Boolean(updates.purchased);
      }
      if (updates.note !== undefined) {
        payload.note = sanitizeStr(updates.note, FIELD_LIMITS.GROCERY_NOTE_MAX);
      }

      try {
        await updateDoc(doc(db, 'users', user.uid, 'groceries', groceryId), payload);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, groceryPath);
      }
    },
    [user],
  );

  const deleteGroceryItem = useCallback(
    async (groceryId: string) => {
      if (!user) return;
      const groceryPath = `users/${user.uid}/groceries/${groceryId}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'groceries', groceryId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, groceryPath);
      }
    },
    [user],
  );

  const seedCommonRationPack = useCallback(async () => {
    if (!user) return;
    const groceriesPath = `users/${user.uid}/groceries`;
    const existingNames = new Set(monthGroceries.map((g) => g.name.toLowerCase()));
    const itemsToAdd = COMMON_RATION_PACK.filter(
      (item) => !existingNames.has(item.name.toLowerCase()),
    );
    if (itemsToAdd.length === 0) return;

    try {
      const batch = writeBatch(db);
      itemsToAdd.forEach((item) => {
        const ref = doc(collection(db, 'users', user.uid, 'groceries'));
        batch.set(ref, {
          userId: user.uid,
          monthKey: selectedMonth,
          name: item.name,
          unit: item.unit,
          plannedQty: item.plannedQty,
          consumedQty: 0,
          unitPrice: item.unitPrice,
          purchased: false,
          note: item.note,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, groceriesPath);
    }
  }, [user, selectedMonth, monthGroceries]);

  const logGroceryAsExpense = useCallback(
    async (item: GroceryItem) => {
      if (!user || item.unitPrice <= 0) return;
      await addExpense({
        title: `${item.name} (${item.plannedQty} ${item.unit})`,
        amount: item.unitPrice,
        category: 'groceries',
        date: getDefaultDateForMonth(selectedMonth),
        paymentMethod: 'cash',
        note: item.note || 'Ration / Grocery purchase',
        groceryItemId: item.id,
      });
      if (!item.purchased) {
        await updateGroceryItem(item.id, { purchased: true });
      }
    },
    [user, selectedMonth, addExpense, updateGroceryItem],
  );

  return {
    loading,
    salary,
    budgetNote,
    monthExpenses,
    expensesWithBalance,
    monthGroceries,
    totalSpent,
    remainingBalance,
    budgetUsedPercent,
    groceryExpenseTotal,
    dailyAverageSpend,
    categorySummaries,
    paymentMethodTotals,
    groceryStats,
    saveMonthlySalary,
    addExpense,
    updateExpense,
    deleteExpense,
    addGroceryItem,
    updateGroceryItem,
    deleteGroceryItem,
    seedCommonRationPack,
    logGroceryAsExpense,
  };
}
