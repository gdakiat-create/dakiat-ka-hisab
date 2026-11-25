import { Download } from 'lucide-react';
import {
  CATEGORY_META,
  formatMoney,
  formatMonthLabel,
  PAYMENT_META,
  pickText,
  UNIT_META,
} from '../i18n/dictionary';
import type {
  CategorySummary,
  CurrencyCode,
  ExpenseEntry,
  GroceryItem,
  LanguageMode,
  PaymentMethod,
} from '../types/expense';
import { CategoryIcon } from './CategoryIcon';

interface ReportsTabProps {
  monthKey: string;
  salary: number;
  totalSpent: number;
  remainingBalance: number;
  categorySummaries: CategorySummary[];
  paymentMethodTotals: Record<PaymentMethod, number>;
  expenses: ExpenseEntry[];
  groceries: GroceryItem[];
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
}

export function ReportsTab({
  monthKey,
  salary,
  totalSpent,
  remainingBalance,
  categorySummaries,
  paymentMethodTotals,
  expenses,
  groceries,
  groceryStats,
  language,
  currency,
}: ReportsTabProps) {
  const handleDownloadCsv = () => {
    const lines: string[] = [];
    lines.push(`HisaabKitab Monthly Report,${formatMonthLabel(monthKey)}`);
    lines.push(`Monthly Salary (${currency}),${salary}`);
    lines.push(`Total Spent (${currency}),${totalSpent}`);
    lines.push(`Remaining Balance (${currency}),${remainingBalance}`);
    lines.push('');
    lines.push('CATEGORY SUMMARY');
    lines.push('Category,Entries,Total Amount,Percent of Spending,Percent of Salary');
    categorySummaries.forEach((c) => {
      const label = `${CATEGORY_META[c.category].roman_urdu} / ${CATEGORY_META[c.category].english}`;
      lines.push(`"${label}",${c.count},${c.total},${c.percentOfSpent}%,${c.percentOfSalary}%`);
    });
    lines.push('');
    lines.push('EXPENSE LOG');
    lines.push('Date,Title,Category,Payment Method,Amount,Note');
    expenses.forEach((e) => {
      const catLabel = `${CATEGORY_META[e.category].roman_urdu} / ${CATEGORY_META[e.category].english}`;
      const payLabel = PAYMENT_META[e.paymentMethod].english;
      const safeTitle = e.title.replace(/"/g, '""');
      const safeNote = (e.note || '').replace(/"/g, '""');
      lines.push(`${e.date},"${safeTitle}","${catLabel}","${payLabel}",${e.amount},"${safeNote}"`);
    });
    lines.push('');
    lines.push('GROCERY CONSUMPTION');
    lines.push('Item,Unit,Planned Qty,Consumed Qty,Remaining Qty,Estimated/Paid Cost,Purchased');
    groceries.forEach((g) => {
      const safeName = g.name.replace(/"/g, '""');
      const rem = Math.max(0, Math.round((g.plannedQty - g.consumedQty) * 10) / 10);
      lines.push(
        `"${safeName}",${g.unit},${g.plannedQty},${g.consumedQty},${rem},${g.unitPrice},${g.purchased ? 'Yes' : 'No'}`,
      );
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HisaabKitab_${monthKey}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const maxCategoryTotal = Math.max(1, ...categorySummaries.map((c) => c.total));
  const finishedOrLowGroceries = groceries.filter(
    (g) => g.plannedQty > 0 && g.consumedQty / g.plannedQty >= 0.8,
  );

  return (
    <div className="space-y-6">
      {/* Header Summary Card */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            {pickText(language, {
              roman_urdu: 'Mahana Category-Wise Summary',
              english: 'Monthly Category Summary',
            })}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {formatMonthLabel(monthKey)} · {expenses.length}{' '}
            {pickText(language, { roman_urdu: 'kharch entries', english: 'expenses' })} ·{' '}
            {groceries.length}{' '}
            {pickText(language, { roman_urdu: 'ration items', english: 'grocery items' })}
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadCsv}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download size={16} aria-hidden="true" />
          <span>
            {pickText(language, {
              roman_urdu: 'CSV Report Download',
              english: 'Download CSV',
            })}
          </span>
        </button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Category-wise Breakdown Chart & Table */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              {pickText(language, {
                roman_urdu: 'Mad ke Hisab se Kharch',
                english: 'Spending by Category',
              })}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {pickText(language, {
                roman_urdu: 'Har category ka kul kharch aur tankhwah ka hissa',
                english: 'Total amount, share of expenses, and percentage of monthly salary',
              })}
            </p>
          </div>

          {totalSpent === 0 ? (
            <p className="py-8 text-sm text-slate-500 text-center">
              {pickText(language, {
                roman_urdu: 'Is maheene abhi koi kharch darj nahi hai.',
                english: 'No expenses recorded for this month yet.',
              })}
            </p>
          ) : (
            <div className="space-y-4">
              {categorySummaries
                .filter((c) => c.total > 0)
                .map((row) => {
                  const meta = CATEGORY_META[row.category];
                  const barWidth = Math.max(4, Math.round((row.total / maxCategoryTotal) * 100));
                  return (
                    <div key={row.category} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <CategoryIcon category={row.category} size={16} className="w-9 h-9" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {pickText(language, meta, ' · ')}
                            </p>
                            <p className="text-xs text-slate-500 font-mono tabular-nums">
                              {row.count}{' '}
                              {pickText(language, {
                                roman_urdu: row.count === 1 ? 'entry' : 'entries',
                                english: row.count === 1 ? 'entry' : 'entries',
                              })}{' '}
                              · {row.percentOfSpent}%{' '}
                              {pickText(language, { roman_urdu: 'kharch', english: 'of spent' })}
                              {salary > 0 && ` · ${row.percentOfSalary}% `}
                              {salary > 0 &&
                                pickText(language, { roman_urdu: 'tankhwah', english: 'of salary' })}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-bold font-mono tabular-nums text-slate-900 shrink-0">
                          {formatMoney(row.total, currency)}
                        </p>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${meta.barColor}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Full tabular summary across all 8 categories */}
          <div className="pt-4 border-t border-slate-100 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3 font-semibold">
                    {pickText(language, { roman_urdu: 'Category', english: 'Category' })}
                  </th>
                  <th className="py-2 px-3 font-semibold text-right">
                    {pickText(language, { roman_urdu: 'Tadaad', english: 'Count' })}
                  </th>
                  <th className="py-2 px-3 font-semibold text-right">
                    {pickText(language, { roman_urdu: 'Hissa', english: 'Share' })}
                  </th>
                  <th className="py-2 pl-3 font-semibold text-right">
                    {pickText(language, { roman_urdu: 'Raqam', english: 'Amount' })}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categorySummaries.map((row) => (
                  <tr key={row.category}>
                    <td className="py-2.5 pr-3 text-slate-800 font-medium">
                      {pickText(language, CATEGORY_META[row.category], ' / ')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                      {row.count}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                      {row.percentOfSpent}%
                    </td>
                    <td className="py-2.5 pl-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {formatMoney(row.total, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 font-bold text-slate-900">
                  <td className="py-2.5 pr-3">
                    {pickText(language, { roman_urdu: 'Kul Jorh', english: 'Total' })}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {expenses.length}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {totalSpent > 0 ? '100%' : '0%'}
                  </td>
                  <td className="py-2.5 pl-3 text-right font-mono tabular-nums">
                    {formatMoney(totalSpent, currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Right Column: Payment Methods + Ration Consumption Summary */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <h3 className="font-display text-base font-bold text-slate-900">
              {pickText(language, {
                roman_urdu: 'Adaigi ka Tareeqa',
                english: 'Payment Method Split',
              })}
            </h3>

            <div className="divide-y divide-slate-100">
              {(['cash', 'bank', 'wallet'] as PaymentMethod[]).map((method) => {
                const amount = paymentMethodTotals[method] || 0;
                const pct = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
                return (
                  <div key={method} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {pickText(language, PAYMENT_META[method], ' / ')}
                      </p>
                      <p className="text-xs text-slate-500 font-mono tabular-nums">{pct}%</p>
                    </div>
                    <p className="text-sm font-bold font-mono tabular-nums text-slate-900">
                      {formatMoney(amount, currency)}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <h3 className="font-display text-base font-bold text-slate-900">
              {pickText(language, {
                roman_urdu: 'Ration Istemaal ki Report',
                english: 'Grocery Consumption Report',
              })}
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-100 pb-4">
              <div>
                <p className="text-slate-500">
                  {pickText(language, { roman_urdu: 'Ausat Istemaal', english: 'Avg Consumed' })}
                </p>
                <p className="mt-0.5 text-lg font-bold font-mono tabular-nums text-slate-900">
                  {groceryStats.totalConsumptionRatio}%
                </p>
              </div>
              <div>
                <p className="text-slate-500">
                  {pickText(language, { roman_urdu: 'Khareeda Hua Cost', english: 'Purchased Cost' })}
                </p>
                <p className="mt-0.5 text-lg font-bold font-mono tabular-nums text-emerald-700">
                  {formatMoney(groceryStats.purchasedCost, currency)}
                </p>
              </div>
            </div>

            {finishedOrLowGroceries.length === 0 ? (
              <p className="text-xs text-slate-500">
                {groceries.length === 0
                  ? pickText(language, {
                      roman_urdu: 'Abhi koi ration item darj nahi hai.',
                      english: 'No grocery items tracked for this month yet.',
                    })
                  : pickText(language, {
                      roman_urdu: 'Sab ration items mein munasib stock mojood hai.',
                      english: 'All tracked grocery items are currently well stocked.',
                    })}
              </p>
            ) : (
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-amber-700">
                  {pickText(language, {
                    roman_urdu: 'Khatam ya Kam Hone Wale Items',
                    english: 'Finished or Running Low Items',
                  })}
                </p>
                <div className="divide-y divide-slate-100">
                  {finishedOrLowGroceries.map((g) => (
                    <div key={g.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-slate-800 truncate">{g.name}</span>
                      <span className="font-mono tabular-nums text-slate-600 shrink-0">
                        {g.consumedQty} / {g.plannedQty} {pickText(language, UNIT_META[g.unit], '/')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
