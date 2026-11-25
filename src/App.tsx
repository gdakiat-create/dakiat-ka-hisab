import { useMemo, useState } from 'react';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Plus,
  ShoppingBasket,
} from 'lucide-react';
import { AuthGate } from './components/AuthGate';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ExpensesTab } from './components/ExpensesTab';
import { GroceryTab } from './components/GroceryTab';
import { OverviewTab } from './components/OverviewTab';
import { ReportsTab } from './components/ReportsTab';
import { ExpenseSheet, GrocerySheet, SalaryModal } from './components/Sheets';
import { FirebaseProvider, useFirebase } from './context/FirebaseContext';
import { useTrackerData } from './hooks/useTrackerData';
import { formatMonthLabel, pickText, shiftMonthKey } from './i18n/dictionary';
import type {
  AppTab,
  CurrencyCode,
  ExpenseEntry,
  GroceryItem,
  LanguageMode,
} from './types/expense';

function getCurrentMonthKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function HisaabWorkspace() {
  const { user, profile, authReady, profileReady, signOutUser, updateUserPreferences } =
    useFirebase();
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthKey);
  const [activeTab, setActiveTab] = useState<AppTab>('overview');

  const [salaryModalOpen, setSalaryModalOpen] = useState(false);
  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);
  const [grocerySheetOpen, setGrocerySheetOpen] = useState(false);
  const [editingGrocery, setEditingGrocery] = useState<GroceryItem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const language: LanguageMode = profile?.preferredLanguage ?? 'both';
  const currency: CurrencyCode = profile?.currency ?? 'PKR';

  const tracker = useTrackerData(selectedMonth);

  const navItems = useMemo(
    () => [
      {
        id: 'overview' as const,
        icon: LayoutDashboard,
        label: pickText(language, { roman_urdu: 'Khata', english: 'Overview' }, ' · '),
        mobileLabel: language === 'english' ? 'Overview' : 'Khata',
      },
      {
        id: 'expenses' as const,
        icon: ListOrdered,
        label: pickText(language, { roman_urdu: 'Kharch', english: 'Expenses' }, ' · '),
        mobileLabel: language === 'english' ? 'Expenses' : 'Kharch',
      },
      {
        id: 'grocery' as const,
        icon: ShoppingBasket,
        label: pickText(language, { roman_urdu: 'Ration', english: 'Grocery' }, ' · '),
        mobileLabel: language === 'english' ? 'Grocery' : 'Ration',
      },
      {
        id: 'reports' as const,
        icon: BarChart3,
        label: pickText(language, { roman_urdu: 'Summary', english: 'Reports' }, ' · '),
        mobileLabel: language === 'english' ? 'Reports' : 'Summary',
      },
    ],
    [language],
  );

  const showToast = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => {
      setNotice((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  if (!authReady || (user && !profileReady)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <p className="font-display text-lg font-bold text-slate-900">HisaabKitab</p>
          <p className="text-sm text-slate-500">
            Hisab load ho raha hai · Loading your ledger...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthGate />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 md:pb-10">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 h-[52px] bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl h-full mx-auto px-4 sm:px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            HisaabKitab
          </button>

          {/* Zone 2: 4 single-line text nav links */}
          <nav className="hidden md:flex items-center gap-6 h-full" aria-label="Primary navigation">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`h-full inline-flex items-center text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'border-emerald-700 text-slate-900 font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary CTA action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => {
                setEditingExpense(null);
                setExpenseSheetOpen(true);
              }}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus size={15} aria-hidden="true" />
              <span>
                {pickText(language, {
                  roman_urdu: 'Kharch Likhein',
                  english: 'Add Expense',
                })}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 space-y-5">
        {/* Workspace Toolbar: Month Switcher, Language Mode, Currency, User */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Month Switcher */}
          <div className="inline-flex items-center bg-white border border-slate-200 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setSelectedMonth((m) => shiftMonthKey(m, -1))}
              aria-label="Previous month"
              className="min-h-[38px] min-w-[38px] flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <span className="px-3 text-xs sm:text-sm font-display font-bold text-slate-900 whitespace-nowrap">
              {formatMonthLabel(selectedMonth)}
            </span>
            <button
              type="button"
              onClick={() => setSelectedMonth((m) => shiftMonthKey(m, 1))}
              aria-label="Next month"
              className="min-h-[38px] min-w-[38px] flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>

          {/* Language, Currency & Sign Out */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex items-center p-1 bg-slate-200/70 rounded-xl"
              role="group"
              aria-label="Language toggle"
            >
              {(
                [
                  { id: 'both', label: 'Dono' },
                  { id: 'roman_urdu', label: 'Roman Urdu' },
                  { id: 'english', label: 'English' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateUserPreferences({ preferredLanguage: opt.id })}
                  className={`min-h-[34px] px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    language === opt.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <select
              value={currency}
              aria-label="Currency"
              onChange={(e) =>
                updateUserPreferences({ currency: e.target.value as CurrencyCode })
              }
              className="min-h-[40px] px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 cursor-pointer"
            >
              <option value="PKR">PKR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="AED">AED</option>
              <option value="SAR">SAR</option>
            </select>

            <button
              type="button"
              onClick={signOutUser}
              title={profile?.displayName || user.email || 'Sign Out'}
              className="min-h-[40px] px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut size={14} aria-hidden="true" />
              <span className="hidden sm:inline">
                {pickText(language, { roman_urdu: 'Bahar Niklein', english: 'Sign Out' })}
              </span>
            </button>
          </div>
        </div>

        {/* Transient Notice Toast */}
        {notice && (
          <div
            role="status"
            className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-medium"
          >
            {notice}
          </div>
        )}

        {/* Loading State or Active Tab View */}
        {tracker.loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500">
            {pickText(language, {
              roman_urdu: 'Mahana hisab load ho raha hai...',
              english: 'Loading monthly ledger...',
            })}
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <OverviewTab
                monthKey={selectedMonth}
                salary={tracker.salary}
                budgetNote={tracker.budgetNote}
                totalSpent={tracker.totalSpent}
                remainingBalance={tracker.remainingBalance}
                groceryExpenseTotal={tracker.groceryExpenseTotal}
                dailyAverageSpend={tracker.dailyAverageSpend}
                budgetUsedPercent={tracker.budgetUsedPercent}
                expensesWithBalance={tracker.expensesWithBalance}
                categorySummaries={tracker.categorySummaries}
                groceryStats={tracker.groceryStats}
                language={language}
                currency={currency}
                onEditSalary={() => setSalaryModalOpen(true)}
                onAddExpense={() => {
                  setEditingExpense(null);
                  setExpenseSheetOpen(true);
                }}
                onSwitchTab={setActiveTab}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpensesTab
                expensesWithBalance={tracker.expensesWithBalance}
                salary={tracker.salary}
                totalSpent={tracker.totalSpent}
                remainingBalance={tracker.remainingBalance}
                language={language}
                currency={currency}
                onAddExpense={() => {
                  setEditingExpense(null);
                  setExpenseSheetOpen(true);
                }}
                onEditExpense={(expense) => {
                  setEditingExpense(expense);
                  setExpenseSheetOpen(true);
                }}
                onDeleteExpense={async (id) => {
                  await tracker.deleteExpense(id);
                  showToast(
                    pickText(language, {
                      roman_urdu: 'Kharch hata diya gaya.',
                      english: 'Expense deleted.',
                    }),
                  );
                }}
              />
            )}

            {activeTab === 'grocery' && (
              <GroceryTab
                groceries={tracker.monthGroceries}
                groceryStats={tracker.groceryStats}
                language={language}
                currency={currency}
                onAddGrocery={() => {
                  setEditingGrocery(null);
                  setGrocerySheetOpen(true);
                }}
                onEditGrocery={(item) => {
                  setEditingGrocery(item);
                  setGrocerySheetOpen(true);
                }}
                onUpdateGrocery={tracker.updateGroceryItem}
                onDeleteGrocery={async (id) => {
                  await tracker.deleteGroceryItem(id);
                  showToast(
                    pickText(language, {
                      roman_urdu: 'Ration item hata diya gaya.',
                      english: 'Grocery item removed.',
                    }),
                  );
                }}
                onSeedCommonRation={async () => {
                  await tracker.seedCommonRationPack();
                  showToast(
                    pickText(language, {
                      roman_urdu: 'Aam ration items list mein shamil ho gaye.',
                      english: 'Common staple items added to grocery list.',
                    }),
                  );
                }}
                onLogAsExpense={async (item) => {
                  await tracker.logGroceryAsExpense(item);
                  showToast(
                    pickText(language, {
                      roman_urdu: `${item.name} rozana kharch mein shamil ho gaya aur balance se ghat gaya.`,
                      english: `${item.name} logged as an expense and deducted from balance.`,
                    }),
                  );
                }}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsTab
                monthKey={selectedMonth}
                salary={tracker.salary}
                totalSpent={tracker.totalSpent}
                remainingBalance={tracker.remainingBalance}
                categorySummaries={tracker.categorySummaries}
                paymentMethodTotals={tracker.paymentMethodTotals}
                expenses={tracker.monthExpenses}
                groceries={tracker.monthGroceries}
                groceryStats={tracker.groceryStats}
                language={language}
                currency={currency}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (4 items, 60px height) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe"
      >
        <div className="grid grid-cols-4 h-[60px]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                  active ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.4 : 1.9} aria-hidden="true" />
                <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
                  {item.mobileLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modals & Bottom Sheets */}
      <SalaryModal
        open={salaryModalOpen}
        onClose={() => setSalaryModalOpen(false)}
        initialSalary={tracker.salary}
        initialNote={tracker.budgetNote}
        language={language}
        currency={currency}
        onSave={async (newSalary, note) => {
          await tracker.saveMonthlySalary(newSalary, note);
          showToast(
            pickText(language, {
              roman_urdu: 'Mahana tankhwah mehfooz ho gayi.',
              english: 'Monthly salary updated.',
            }),
          );
        }}
      />

      <ExpenseSheet
        open={expenseSheetOpen}
        onClose={() => setExpenseSheetOpen(false)}
        monthKey={selectedMonth}
        editingExpense={editingExpense}
        language={language}
        currency={currency}
        onSave={async (payload, editingId) => {
          if (editingId) {
            await tracker.updateExpense(editingId, payload);
            showToast(
              pickText(language, {
                roman_urdu: 'Kharch update ho gaya.',
                english: 'Expense updated.',
              }),
            );
          } else {
            await tracker.addExpense(payload);
            showToast(
              pickText(language, {
                roman_urdu: 'Kharch darj ho gaya aur balance se ghat gaya.',
                english: 'Expense saved and deducted from balance.',
              }),
            );
          }
        }}
      />

      <GrocerySheet
        open={grocerySheetOpen}
        onClose={() => setGrocerySheetOpen(false)}
        editingGrocery={editingGrocery}
        language={language}
        currency={currency}
        onSave={async (payload, editingId) => {
          if (editingId) {
            await tracker.updateGroceryItem(editingId, payload);
            showToast(
              pickText(language, {
                roman_urdu: 'Ration item update ho gaya.',
                english: 'Grocery item updated.',
              }),
            );
          } else {
            await tracker.addGroceryItem(payload);
            showToast(
              pickText(language, {
                roman_urdu: 'Naya ration item shamil ho gaya.',
                english: 'Grocery item added.',
              }),
            );
          }
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <HisaabWorkspace />
      </FirebaseProvider>
    </ErrorBoundary>
  );
}
