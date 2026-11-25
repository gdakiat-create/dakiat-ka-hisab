import { useMemo, useState } from 'react';
import {
  Check,
  Minus,
  Pencil,
  Plus,
  Receipt,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { formatMoney, pickText, UNIT_META } from '../i18n/dictionary';
import type { CurrencyCode, GroceryItem, LanguageMode } from '../types/expense';

interface GroceryTabProps {
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
  onAddGrocery: () => void;
  onEditGrocery: (item: GroceryItem) => void;
  onUpdateGrocery: (
    id: string,
    updates: Partial<Pick<GroceryItem, 'consumedQty' | 'purchased'>>,
  ) => Promise<void>;
  onDeleteGrocery: (id: string) => Promise<void>;
  onSeedCommonRation: () => Promise<void>;
  onLogAsExpense: (item: GroceryItem) => Promise<void>;
}

type GroceryFilter = 'all' | 'in_stock' | 'low' | 'finished' | 'unpurchased';

export function GroceryTab({
  groceries,
  groceryStats,
  language,
  currency,
  onAddGrocery,
  onEditGrocery,
  onUpdateGrocery,
  onDeleteGrocery,
  onSeedCommonRation,
  onLogAsExpense,
}: GroceryTabProps) {
  const [filter, setFilter] = useState<GroceryFilter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const filteredItems = useMemo(() => {
    return groceries.filter((item) => {
      const ratio = item.plannedQty > 0 ? item.consumedQty / item.plannedQty : 0;
      if (filter === 'in_stock') return ratio < 0.8;
      if (filter === 'low') return ratio >= 0.8 && ratio < 1;
      if (filter === 'finished') return item.plannedQty > 0 && item.consumedQty >= item.plannedQty;
      if (filter === 'unpurchased') return !item.purchased;
      return true;
    });
  }, [groceries, filter]);

  const handleStepConsumption = async (item: GroceryItem, delta: number) => {
    const next = Math.max(
      0,
      Math.min(item.plannedQty > 0 ? item.plannedQty * 2 : 1000, Math.round((item.consumedQty + delta) * 10) / 10),
    );
    setBusyId(item.id);
    try {
      await onUpdateGrocery(item.id, { consumedQty: next });
    } finally {
      setBusyId(null);
    }
  };

  const handleTogglePurchased = async (item: GroceryItem) => {
    setBusyId(item.id);
    try {
      await onUpdateGrocery(item.id, { purchased: !item.purchased });
    } finally {
      setBusyId(null);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await onSeedCommonRation();
    } finally {
      setSeeding(false);
    }
  };

  const handleLogExpense = async (item: GroceryItem) => {
    setBusyId(item.id);
    try {
      await onLogAsExpense(item);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Grocery Summary Strip */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 w-full sm:w-auto">
            <div>
              <p className="text-xs text-slate-500">
                {pickText(language, { roman_urdu: 'Kul Items', english: 'Total Items' })}
              </p>
              <p className="text-base font-bold font-mono tabular-nums text-slate-900">
                {groceryStats.totalItems}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">
                {pickText(language, { roman_urdu: 'Khareed Liya', english: 'Purchased' })}
              </p>
              <p className="text-base font-bold font-mono tabular-nums text-emerald-700">
                {groceryStats.purchasedItems} / {groceryStats.totalItems}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">
                {pickText(language, { roman_urdu: 'Andazan Qeemat', english: 'Ration Budget' })}
              </p>
              <p className="text-base font-bold font-mono tabular-nums text-slate-900">
                {formatMoney(groceryStats.totalEstimatedCost, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">
                {pickText(language, { roman_urdu: 'Istemaal', english: 'Avg Used' })}
              </p>
              <p className="text-base font-bold font-mono tabular-nums text-slate-900">
                {groceryStats.totalConsumptionRatio}%
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSeed}
              disabled={seeding}
              className="flex-1 sm:flex-none min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-60"
            >
              <Sparkles size={14} aria-hidden="true" />
              <span>
                {seeding
                  ? pickText(language, { roman_urdu: 'Shamil ho raha hai...', english: 'Adding...' })
                  : pickText(language, {
                      roman_urdu: 'Aam Ration Pack',
                      english: 'Add Staple Pack',
                    })}
              </span>
            </button>

            <button
              type="button"
              onClick={onAddGrocery}
              className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Plus size={16} aria-hidden="true" />
              <span>
                {pickText(language, {
                  roman_urdu: 'Naya Item',
                  english: 'Add Grocery',
                })}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {(
          [
            { id: 'all', text: { roman_urdu: 'Sab', english: 'All' } },
            { id: 'in_stock', text: { roman_urdu: 'Bacha Hua', english: 'In Stock' } },
            { id: 'low', text: { roman_urdu: 'Kam Reh Gaya', english: 'Running Low' } },
            { id: 'finished', text: { roman_urdu: 'Khatam', english: 'Finished' } },
            { id: 'unpurchased', text: { roman_urdu: 'Khareedna Baqi', english: 'To Buy' } },
          ] as const
        ).map((tab) => {
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              {pickText(language, tab.text, ' / ')}
            </button>
          );
        })}
      </div>

      {/* Itemized Grocery Consumption List */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-medium text-slate-700">
              {groceries.length === 0
                ? pickText(language, {
                    roman_urdu: 'Is maheene ki ration list abhi khali hai.',
                    english: 'Your monthly grocery list is empty.',
                  })
                : pickText(language, {
                    roman_urdu: 'Is filter mein koi item nahi hai.',
                    english: 'No items match this filter.',
                  })}
            </p>
            {groceries.length === 0 && (
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {pickText(language, {
                  roman_urdu:
                    'Aap "Aam Ration Pack" button daba kar atta, chawal, oil aur doodh foran shamil kar sakte hain ya khud naya item likh sakte hain.',
                  english:
                    'Use "Add Staple Pack" above to prefill common monthly items or tap Add Grocery to create your own.',
                })}
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredItems.map((item) => {
              const unitLabel = pickText(language, UNIT_META[item.unit], '/');
              const remainingQty = Math.max(
                0,
                Math.round((item.plannedQty - item.consumedQty) * 10) / 10,
              );
              const pct =
                item.plannedQty > 0
                  ? Math.min(100, Math.round((item.consumedQty / item.plannedQty) * 100))
                  : 0;
              const isFinished = item.plannedQty > 0 && item.consumedQty >= item.plannedQty;
              const isLow = !isFinished && pct >= 80;
              const step = item.unit === 'kg' || item.unit === 'litre' ? 0.5 : 1;

              const barColor = isFinished
                ? 'bg-rose-600'
                : isLow
                  ? 'bg-amber-500'
                  : 'bg-emerald-600';

              const statusText = isFinished
                ? pickText(language, { roman_urdu: 'Khatam', english: 'Finished' })
                : isLow
                  ? pickText(language, { roman_urdu: 'Kam hai', english: 'Running Low' })
                  : pickText(language, { roman_urdu: 'Mojood', english: 'In Stock' });

              return (
                <div
                  key={item.id}
                  className="p-4 sm:px-6 sm:py-4 space-y-3 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleTogglePurchased(item)}
                        disabled={busyId === item.id}
                        aria-label={`Mark ${item.name} as ${item.purchased ? 'unpurchased' : 'purchased'}`}
                        className={`mt-0.5 w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          item.purchased
                            ? 'bg-emerald-700 border-emerald-700 text-white'
                            : 'bg-white border-slate-300 text-transparent hover:border-emerald-600'
                        }`}
                      >
                        <Check size={18} aria-hidden="true" />
                      </button>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <h3
                            className={`text-sm font-semibold ${
                              item.purchased ? 'text-slate-900' : 'text-slate-800'
                            }`}
                          >
                            {item.name}
                          </h3>
                          <span
                            className={`text-xs font-semibold ${
                              isFinished
                                ? 'text-rose-700'
                                : isLow
                                  ? 'text-amber-700'
                                  : 'text-emerald-700'
                            }`}
                          >
                            · {statusText}
                          </span>
                        </div>

                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                          <span className="font-mono tabular-nums">
                            {pickText(language, { roman_urdu: 'Hadaf', english: 'Planned' })}:{' '}
                            {item.plannedQty} {unitLabel}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {item.unitPrice > 0
                              ? formatMoney(item.unitPrice, currency)
                              : pickText(language, {
                                  roman_urdu: 'Qeemat nahi likhi',
                                  english: 'No price set',
                                })}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {item.purchased
                              ? pickText(language, { roman_urdu: 'Khareed liya', english: 'Bought' })
                              : pickText(language, { roman_urdu: 'Khareedna hai', english: 'To buy' })}
                          </span>
                        </div>

                        {item.note && (
                          <p className="mt-1 text-xs text-slate-500">{item.note}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditGrocery(item)}
                        aria-label={`Edit ${item.name}`}
                        className="min-h-[44px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-800 rounded-lg cursor-pointer"
                      >
                        <Pencil size={15} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteGrocery(item.id)}
                        aria-label={`Delete ${item.name}`}
                        className="min-h-[44px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-rose-700 rounded-lg cursor-pointer"
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {/* Consumption Bar + Tactile Stepper Controls */}
                  <div className="pl-14 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-mono tabular-nums">
                          {pickText(language, { roman_urdu: 'Istemaal', english: 'Used' })}:{' '}
                          <strong className="text-slate-900">
                            {item.consumedQty} / {item.plannedQty} {unitLabel}
                          </strong>
                        </span>
                        <span className="text-slate-500 font-mono tabular-nums">
                          {remainingQty} {unitLabel}{' '}
                          {pickText(language, { roman_urdu: 'bacha', english: 'left' })} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-200 ${barColor}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="inline-flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleStepConsumption(item, -step)}
                          disabled={busyId === item.id || item.consumedQty <= 0}
                          aria-label={`Decrease consumed quantity of ${item.name}`}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-700 hover:bg-slate-200/70 disabled:opacity-40 cursor-pointer"
                        >
                          <Minus size={14} aria-hidden="true" />
                        </button>
                        <span className="px-2.5 text-xs font-mono font-semibold tabular-nums text-slate-800">
                          {step} {unitLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStepConsumption(item, step)}
                          disabled={busyId === item.id}
                          aria-label={`Increase consumed quantity of ${item.name}`}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-700 hover:bg-slate-200/70 disabled:opacity-40 cursor-pointer"
                        >
                          <Plus size={14} aria-hidden="true" />
                        </button>
                      </div>

                      {item.unitPrice > 0 && (
                        <button
                          type="button"
                          onClick={() => handleLogExpense(item)}
                          disabled={busyId === item.id}
                          className="min-h-[40px] px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-50"
                          title="Deduct this grocery item cost from monthly salary balance"
                        >
                          <Receipt size={13} aria-hidden="true" />
                          <span>
                            {pickText(language, {
                              roman_urdu: 'Kharch Mein Daalein',
                              english: 'Log Expense',
                            })}
                          </span>
                        </button>
                      )}
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
