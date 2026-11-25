import { ArrowRight, Plus, ShoppingBasket } from 'lucide-react';
import {
  CATEGORY_META,
  formatMoney,
  formatShortDate,
  PAYMENT_META,
  pickText,
} from '../i18n/dictionary';
import type {
  AppTab,
  CategorySummary,
  CurrencyCode,
  ExpenseWithRunningBalance,
  LanguageMode,
} from '../types/expense';
import { BalanceHero } from './BalanceHero';
import { CategoryIcon } from './CategoryIcon';

interface OverviewTabProps {
  monthKey: string;
  salary: number;
  budgetNote: string;
  totalSpent: number;
  remainingBalance: number;
  groceryExpenseTotal: number;
  dailyAverageSpend: number;
  budgetUsedPercent: number;
  expensesWithBalance: ExpenseWithRunningBalance[];
  categorySummaries: CategorySummary[];
  groceryStats: {
    totalItems: number;
    purchasedItems: number;
    totalEstimatedCost: number;
    purchasedCost: number;
    totalConsumptionRatio: number;
    lowOrFinishedCount: number;
  };
  language: LanguageMode;
  currency: CurrencyCode;
  onEditSalary: () => void;
  onAddExpense: () => void;
  onSwitchTab: (tab: AppTab) => void;
}

export function OverviewTab({
  monthKey,
  salary,
  budgetNote,
  totalSpent,
  remainingBalance,
  groceryExpenseTotal,
  dailyAverageSpend,
  budgetUsedPercent,
  expensesWithBalance,
  categorySummaries,
  groceryStats,
  language,
  currency,
  onEditSalary,
  onAddExpense,
  onSwitchTab,
}: OverviewTabProps) {
  const recentExpenses = [...expensesWithBalance].reverse().slice(0, 6);
  const activeCategories = categorySummaries.filter((c) => c.total > 0).slice(0, 4);

  return (
    <div className="space-y-6">
      <BalanceHero
        monthKey={monthKey}
        salary={salary}
        budgetNote={budgetNote}
        totalSpent={totalSpent}
        remainingBalance={remainingBalance}
        groceryExpenseTotal={groceryExpenseTotal}
        dailyAverageSpend={dailyAverageSpend}
        budgetUsedPercent={budgetUsedPercent}
        language={language}
        currency={currency}
        onEditSalary={onEditSalary}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recent Daily Expense Deductions */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                {pickText(language, {
                  roman_urdu: 'Haaliya Rozana Kharch',
                  english: 'Recent Daily Deductions',
                })}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {pickText(language, {
                  roman_urdu: 'Har entry ke baad baqi balance khud ghat jata hai',
                  english: 'Each entry automatically deducts from your monthly balance',
                })}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSwitchTab('expenses')}
              className="min-h-[40px] px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>
                {pickText(language, {
                  roman_urdu: 'Sab Dekhein',
                  english: 'View All',
                })}
              </span>
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>

          {recentExpenses.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <p className="text-sm font-medium text-slate-700">
                {pickText(language, {
                  roman_urdu: 'Abhi is maheene ka koi kharch darj nahi hai.',
                  english: 'No expenses logged for this month yet.',
                })}
              </p>
              <button
                type="button"
                onClick={onAddExpense}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Plus size={15} aria-hidden="true" />
                <span>
                  {pickText(language, {
                    roman_urdu: 'Pehla Kharch Likhein',
                    english: 'Add First Expense',
                  })}
                </span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentExpenses.map((entry) => {
                const catMeta = CATEGORY_META[entry.category];
                const payMeta = PAYMENT_META[entry.paymentMethod];
                return (
                  <div
                    key={entry.id}
                    className="py-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CategoryIcon category={entry.category} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {entry.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                          <span>{formatShortDate(entry.date)}</span>
                          <span aria-hidden="true">·</span>
                          <span>{pickText(language, catMeta, ' / ')}</span>
                          <span aria-hidden="true">·</span>
                          <span>{pickText(language, payMeta, ' / ')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-rose-700 font-mono tabular-nums">
                        -{formatMoney(entry.amount, currency)}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                        {pickText(language, { roman_urdu: 'Baqi', english: 'Bal' })}{' '}
                        {formatMoney(entry.balanceAfter, currency)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Column: Top Categories + Grocery Pulse */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <h2 className="font-display text-base font-bold text-slate-900">
                {pickText(language, {
                  roman_urdu: 'Aham Madat (Top Categories)',
                  english: 'Top Spending Categories',
                })}
              </h2>
              <button
                type="button"
                onClick={() => onSwitchTab('reports')}
                className="min-h-[40px] px-2 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>
                  {pickText(language, {
                    roman_urdu: 'Report',
                    english: 'Full Report',
                  })}
                </span>
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>

            {activeCategories.length === 0 ? (
              <p className="py-6 text-sm text-slate-500 text-center">
                {pickText(language, {
                  roman_urdu: 'Kharch darj karne par yahan hisab dikhega.',
                  english: 'Category breakdown will appear once you add expenses.',
                })}
              </p>
            ) : (
              <div className="pt-4 space-y-4">
                {activeCategories.map((item) => {
                  const meta = CATEGORY_META[item.category];
                  return (
                    <div key={item.category} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-slate-800 truncate">
                          {pickText(language, meta, ' · ')}
                        </span>
                        <span className="font-mono tabular-nums text-slate-900 font-semibold shrink-0">
                          {formatMoney(item.total, currency)}{' '}
                          <span className="text-slate-500 font-normal">
                            ({item.percentOfSpent}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${meta.barColor}`}
                          style={{ width: `${Math.max(4, item.percentOfSpent)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShoppingBasket size={20} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900">
                    {pickText(language, {
                      roman_urdu: 'Mahana Ration Hisab',
                      english: 'Monthly Grocery Consumption',
                    })}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {groceryStats.totalItems}{' '}
                    {pickText(language, {
                      roman_urdu: 'items darj',
                      english: 'items tracked',
                    })}{' '}
                    · {groceryStats.totalConsumptionRatio}%{' '}
                    {pickText(language, {
                      roman_urdu: 'istemaal',
                      english: 'consumed',
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-500">
                  {pickText(language, {
                    roman_urdu: 'Khareede Gaye',
                    english: 'Purchased',
                  })}
                </p>
                <p className="mt-0.5 text-sm font-bold font-mono tabular-nums text-slate-900">
                  {groceryStats.purchasedItems} / {groceryStats.totalItems}
                </p>
              </div>
              <div>
                <p className="text-slate-500">
                  {pickText(language, {
                    roman_urdu: 'Khatam ke Qareeb',
                    english: 'Running Low',
                  })}
                </p>
                <p className="mt-0.5 text-sm font-bold font-mono tabular-nums text-amber-700">
                  {groceryStats.lowOrFinishedCount}{' '}
                  {pickText(language, { roman_urdu: 'items', english: 'items' })}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSwitchTab('grocery')}
              className="mt-4 w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>
                {pickText(language, {
                  roman_urdu: 'Ration List Kholein',
                  english: 'Manage Monthly Groceries',
                })}
              </span>
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
