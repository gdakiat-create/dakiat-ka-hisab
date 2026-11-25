import { AlertTriangle, CheckCircle2, Pencil } from 'lucide-react';
import { formatMoney, formatMonthLabel, pickText } from '../i18n/dictionary';
import type { CurrencyCode, LanguageMode } from '../types/expense';

interface BalanceHeroProps {
  monthKey: string;
  salary: number;
  budgetNote: string;
  totalSpent: number;
  remainingBalance: number;
  groceryExpenseTotal: number;
  dailyAverageSpend: number;
  budgetUsedPercent: number;
  language: LanguageMode;
  currency: CurrencyCode;
  onEditSalary: () => void;
}

export function BalanceHero({
  monthKey,
  salary,
  budgetNote,
  totalSpent,
  remainingBalance,
  groceryExpenseTotal,
  dailyAverageSpend,
  budgetUsedPercent,
  language,
  currency,
  onEditSalary,
}: BalanceHeroProps) {
  const isOverBudget = salary > 0 && remainingBalance < 0;
  const isLowBudget = salary > 0 && remainingBalance >= 0 && budgetUsedPercent >= 80;
  const noSalarySet = salary <= 0;

  const statusText = noSalarySet
    ? pickText(language, {
        roman_urdu: 'Tankhwah Darj Karein',
        english: 'Set Monthly Salary',
      })
    : isOverBudget
      ? pickText(language, {
          roman_urdu: 'Budget Se Zyada Kharch',
          english: 'Over Budget',
        })
      : isLowBudget
        ? pickText(language, {
            roman_urdu: 'Budget Kam Reh Gaya',
            english: 'Low Remaining Balance',
          })
        : pickText(language, {
            roman_urdu: 'Budget Control Mein Hai',
            english: 'On Track',
          });

  const statusColor = noSalarySet
    ? 'text-slate-600'
    : isOverBudget
      ? 'text-rose-700'
      : isLowBudget
        ? 'text-amber-700'
        : 'text-emerald-700';

  const barColor = isOverBudget
    ? 'bg-rose-600'
    : isLowBudget
      ? 'bg-amber-500'
      : 'bg-emerald-600';

  return (
    <section
      aria-label="Monthly balance overview"
      className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{formatMonthLabel(monthKey)}</span>
            <span aria-hidden="true">·</span>
            <span className={`inline-flex items-center gap-1 font-semibold ${statusColor}`}>
              {isOverBudget || isLowBudget ? (
                <AlertTriangle size={13} aria-hidden="true" />
              ) : (
                <CheckCircle2 size={13} aria-hidden="true" />
              )}
              <span>{statusText}</span>
            </span>
          </div>

          <p className="text-sm font-medium text-slate-600 pt-1">
            {pickText(language, {
              roman_urdu: 'Baqi Budget',
              english: 'Remaining Balance',
            })}
          </p>

          <p
            className={`font-display text-3xl sm:text-4xl font-bold tracking-tight tabular-nums ${
              isOverBudget ? 'text-rose-700' : 'text-slate-900'
            }`}
          >
            {formatMoney(remainingBalance, currency)}
          </p>

          {budgetNote && (
            <p className="text-xs text-slate-500 pt-0.5">{budgetNote}</p>
          )}
        </div>

        <button
          type="button"
          onClick={onEditSalary}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Pencil size={14} aria-hidden="true" />
          <span>
            {salary > 0
              ? pickText(language, {
                  roman_urdu: 'Tankhwah Badlein',
                  english: 'Edit Salary',
                })
              : pickText(language, {
                  roman_urdu: 'Tankhwah Likhein',
                  english: 'Set Salary',
                })}
          </span>
        </button>
      </div>

      {/* Budget Progress Bar */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
          <span>
            {pickText(language, {
              roman_urdu: 'Tankhwah ka Istemaal',
              english: 'Salary Utilized',
            })}
          </span>
          <span className="font-mono font-semibold tabular-nums text-slate-900">
            {salary > 0 ? `${Math.round((totalSpent / salary) * 100)}%` : '0%'}
          </span>
        </div>
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${Math.min(100, Math.max(0, budgetUsedPercent))}%` }}
          />
        </div>
      </div>

      {/* 4-column metric strip separated by subtle hairlines, no nested cards */}
      <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-slate-500">
            {pickText(language, {
              roman_urdu: 'Mahana Tankhwah',
              english: 'Monthly Salary',
            })}
          </p>
          <p className="mt-0.5 text-base font-bold text-slate-900 tabular-nums font-mono">
            {formatMoney(salary, currency)}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">
            {pickText(language, {
              roman_urdu: 'Kul Kharch',
              english: 'Total Spent',
            })}
          </p>
          <p className="mt-0.5 text-base font-bold text-rose-700 tabular-nums font-mono">
            {formatMoney(totalSpent, currency)}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">
            {pickText(language, {
              roman_urdu: 'Ration Kharch',
              english: 'Grocery Spend',
            })}
          </p>
          <p className="mt-0.5 text-base font-bold text-emerald-700 tabular-nums font-mono">
            {formatMoney(groceryExpenseTotal, currency)}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">
            {pickText(language, {
              roman_urdu: 'Rozana Ausat',
              english: 'Daily Average',
            })}
          </p>
          <p className="mt-0.5 text-base font-bold text-slate-900 tabular-nums font-mono">
            {formatMoney(dailyAverageSpend, currency)}
          </p>
        </div>
      </div>
    </section>
  );
}
