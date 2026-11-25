import type { Timestamp } from 'firebase/firestore';

export type LanguageMode = 'both' | 'roman_urdu' | 'english';

export type CurrencyCode = 'PKR' | 'USD' | 'GBP' | 'AED' | 'SAR';

export type ExpenseCategory =
  | 'groceries'
  | 'utilities'
  | 'transport'
  | 'dining'
  | 'health'
  | 'education'
  | 'shopping'
  | 'other';

export type PaymentMethod = 'cash' | 'bank' | 'wallet';

export type GroceryUnit = 'kg' | 'g' | 'litre' | 'ml' | 'pack' | 'dozen' | 'piece';

export type AppTab = 'overview' | 'expenses' | 'grocery' | 'reports';

export interface UserProfile {
  uid: string;
  displayName: string;
  preferredLanguage: LanguageMode;
  currency: CurrencyCode;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface MonthlyBudget {
  id: string;
  userId: string;
  monthKey: string; // YYYY-MM
  salary: number;
  budgetNote: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ExpenseEntry {
  id: string;
  userId: string;
  monthKey: string; // YYYY-MM
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  note: string;
  groceryItemId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ExpenseWithRunningBalance extends ExpenseEntry {
  runningSpent: number;
  balanceAfter: number;
}

export interface GroceryItem {
  id: string;
  userId: string;
  monthKey: string; // YYYY-MM
  name: string;
  unit: GroceryUnit;
  plannedQty: number;
  consumedQty: number;
  unitPrice: number;
  purchased: boolean;
  note: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CategorySummary {
  category: ExpenseCategory;
  total: number;
  count: number;
  percentOfSpent: number;
  percentOfSalary: number;
}

export const FIELD_LIMITS = {
  DISPLAY_NAME_MAX: 80,
  BUDGET_NOTE_MAX: 200,
  EXPENSE_TITLE_MAX: 100,
  EXPENSE_NOTE_MAX: 250,
  GROCERY_NAME_MAX: 100,
  GROCERY_NOTE_MAX: 200,
  MAX_AMOUNT: 100_000_000,
  MAX_QTY: 100_000,
  MAX_PRICE: 10_000_000,
} as const;

export const CURRENCY_SYMBOL: Record<CurrencyCode, string> = {
  PKR: 'Rs.',
  USD: '$',
  GBP: '£',
  AED: 'AED',
  SAR: 'SAR',
};
