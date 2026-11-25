import { useMemo, useState } from 'react';
import { ArrowDownUp, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import {
  CATEGORY_META,
  formatMoney,
  formatShortDate,
  PAYMENT_META,
  pickText,
} from '../i18n/dictionary';
import type {
  CurrencyCode,
  ExpenseCategory,
  ExpenseEntry,
  ExpenseWithRunningBalance,
  LanguageMode,
} from '../types/expense';
import { CategoryIcon } from './CategoryIcon';

interface ExpensesTabProps {
  expensesWithBalance: ExpenseWithRunningBalance[];
  salary: number;
  totalSpent: number;
  remainingBalance: number;
  language: LanguageMode;
  currency: CurrencyCode;
  onAddExpense: () => void;
  onEditExpense: (expense: ExpenseEntry) => void;
  onDeleteExpense: (expenseId: string) => Promise<void>;
}

const CATEGORY_LIST: Array<'all' | ExpenseCategory> = [
  'all',
  'groceries',
  'utilities',
  'transport',
  'dining',
  'health',
  'education',
  'shopping',
  'other',
];

export function ExpensesTab({
  expensesWithBalance,
  salary,
  totalSpent,
  remainingBalance,
  language,
  currency,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}: ExpensesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | ExpenseCategory>('all');
  const [newestFirst, setNewestFirst] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredExpenses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = expensesWithBalance.filter((entry) => {
      if (selectedCategory !== 'all' && entry.category !== selectedCategory) return false;
      if (
        q &&
        !entry.title.toLowerCase().includes(q) &&
        !entry.note.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
    return newestFirst ? [...list].reverse() : list;
  }, [expensesWithBalance, searchQuery, selectedCategory, newestFirst]);

  const filteredTotal = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses],
  );

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDeleteExpense(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Running Total & Balance Bar */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="grid grid-cols-3 gap-4 sm:gap-8 w-full sm:w-auto">
          <div>
            <p className="text-xs text-slate-500">
              {pickText(language, { roman_urdu: 'Tankhwah', english: 'Salary' })}
            </p>
            <p className="text-sm sm:text-base font-bold font-mono tabular-nums text-slate-900">
              {formatMoney(salary, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">
              {pickText(language, { roman_urdu: 'Kul Kharch', english: 'Total Spent' })}
            </p>
            <p className="text-sm sm:text-base font-bold font-mono tabular-nums text-rose-700">
              {formatMoney(totalSpent, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">
              {pickText(language, { roman_urdu: 'Baqi Balance', english: 'Remaining' })}
            </p>
            <p
              className={`text-sm sm:text-base font-bold font-mono tabular-nums ${
                remainingBalance < 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              {formatMoney(remainingBalance, currency)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddExpense}
          className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus size={16} aria-hidden="true" />
          <span>
            {pickText(language, {
              roman_urdu: 'Naya Kharch Likhein',
              english: 'Add Expense',
            })}
          </span>
        </button>
      </section>

      {/* Search + Sort + Category Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              aria-hidden="true"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={pickText(language, {
                roman_urdu: 'Kharch dhoondein (jaise bijli, doodh, petrol)...',
                english: 'Search expenses (e.g. electricity, milk, fuel)...',
              })}
              className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
            />
          </div>

          <button
            type="button"
            onClick={() => setNewestFirst((v) => !v)}
            className="min-h-[44px] px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowDownUp size={14} aria-hidden="true" />
            <span>
              {newestFirst
                ? pickText(language, { roman_urdu: 'Naya Pehle', english: 'Newest' })
                : pickText(language, { roman_urdu: 'Tarteeb War', english: 'Ledger Order' })}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {CATEGORY_LIST.map((cat) => {
            const active = selectedCategory === cat;
            const label =
              cat === 'all'
                ? pickText(language, { roman_urdu: 'Sab', english: 'All' })
                : pickText(language, CATEGORY_META[cat], ' / ');
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Expense Ledger List */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            {filteredExpenses.length}{' '}
            {pickText(language, { roman_urdu: 'entries', english: 'entries' })}
          </span>
          <span className="font-mono tabular-nums font-semibold text-slate-800">
            {pickText(language, { roman_urdu: 'Filter Total', english: 'Filtered Total' })}:{' '}
            {formatMoney(filteredTotal, currency)}
          </span>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-medium text-slate-700">
              {pickText(language, {
                roman_urdu: 'Koi kharch nahi mila.',
                english: 'No matching expenses found.',
              })}
            </p>
            <p className="text-xs text-slate-500">
              {pickText(language, {
                roman_urdu: 'Naya kharch darj karne ke liye upar button dabayein.',
                english: 'Tap Add Expense above to log a new deduction.',
              })}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredExpenses.map((entry) => {
              const catMeta = CATEGORY_META[entry.category];
              const payMeta = PAYMENT_META[entry.paymentMethod];
              return (
                <div
                  key={entry.id}
                  className="px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <CategoryIcon category={entry.category} className="mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {entry.title}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        <span>{formatShortDate(entry.date)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{pickText(language, catMeta, ' / ')}</span>
                        <span aria-hidden="true">·</span>
                        <span>{pickText(language, payMeta, ' / ')}</span>
                      </div>
                      {entry.note && (
                        <p className="mt-1 text-xs text-slate-500 line-clamp-1">{entry.note}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-rose-700 font-mono tabular-nums">
                        -{formatMoney(entry.amount, currency)}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                        {pickText(language, { roman_urdu: 'Baqi', english: 'Bal' })}:{' '}
                        {formatMoney(entry.balanceAfter, currency)}
                      </p>
                    </div>

                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => onEditExpense(entry)}
                        aria-label={`Edit ${entry.title}`}
                        className="min-h-[44px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-800 rounded-lg cursor-pointer"
                      >
                        <Pencil size={15} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        disabled={deletingId === entry.id}
                        aria-label={`Delete ${entry.title}`}
                        className="min-h-[44px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-rose-700 rounded-lg disabled:opacity-40 cursor-pointer"
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
