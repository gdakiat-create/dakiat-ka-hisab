import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  CATEGORY_META,
  getDefaultDateForMonth,
  PAYMENT_META,
  pickText,
  QUICK_EXPENSE_PRESETS,
  UNIT_META,
} from '../i18n/dictionary';
import {
  type CurrencyCode,
  CURRENCY_SYMBOL,
  type ExpenseCategory,
  type ExpenseEntry,
  FIELD_LIMITS,
  type GroceryItem,
  type GroceryUnit,
  type LanguageMode,
  type PaymentMethod,
} from '../types/expense';

function SheetContainer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 shrink-0" />
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <h2 className="font-display text-base font-bold text-slate-900 truncate">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-xl cursor-pointer"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function SalaryModal({
  open,
  onClose,
  initialSalary,
  initialNote,
  language,
  currency,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initialSalary: number;
  initialNote: string;
  language: LanguageMode;
  currency: CurrencyCode;
  onSave: (salary: number, note: string) => Promise<void>;
}) {
  const [salaryStr, setSalaryStr] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSalaryStr(initialSalary > 0 ? String(initialSalary) : '');
      setNote(initialNote || '');
    }
  }, [open, initialSalary, initialNote]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(salaryStr);
    if (!Number.isFinite(numeric) || numeric < 0) return;
    setSaving(true);
    try {
      await onSave(numeric, note);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetContainer
      open={open}
      onClose={onClose}
      title={pickText(language, {
        roman_urdu: 'Mahana Tankhwah Darj Karein',
        english: 'Set Monthly Salary',
      })}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            {pickText(language, {
              roman_urdu: `Kul Tankhwah (${CURRENCY_SYMBOL[currency]})`,
              english: `Monthly Salary (${CURRENCY_SYMBOL[currency]})`,
            })}
          </label>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={FIELD_LIMITS.MAX_AMOUNT}
            step="any"
            required
            value={salaryStr}
            onChange={(e) => setSalaryStr(e.target.value)}
            placeholder="e.g. 120000"
            className="w-full min-h-[48px] px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            {pickText(language, {
              roman_urdu: 'Yaad-dahani / Note (Ikhtiyari)',
              english: 'Budget Note (Optional)',
            })}
          </label>
          <input
            type="text"
            maxLength={FIELD_LIMITS.BUDGET_NOTE_MAX}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={pickText(language, {
              roman_urdu: 'Jaise: Tankhwah aur bonus shamil hai',
              english: 'e.g. Includes base pay and allowance',
            })}
            className="w-full min-h-[44px] px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
          />
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
          >
            {pickText(language, { roman_urdu: 'Band Karein', english: 'Cancel' })}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold disabled:opacity-60 cursor-pointer"
          >
            {saving
              ? pickText(language, { roman_urdu: 'Mehfooz ho raha hai...', english: 'Saving...' })
              : pickText(language, { roman_urdu: 'Save Karein', english: 'Save Salary' })}
          </button>
        </div>
      </form>
    </SheetContainer>
  );
}

export function ExpenseSheet({
  open,
  onClose,
  monthKey,
  editingExpense,
  language,
  currency,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  monthKey: string;
  editingExpense: ExpenseEntry | null;
  language: LanguageMode;
  currency: CurrencyCode;
  onSave: (
    payload: {
      title: string;
      amount: number;
      category: ExpenseCategory;
      date: string;
      paymentMethod: PaymentMethod;
      note: string;
    },
    editingId?: string,
  ) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('groceries');
  const [date, setDate] = useState(getDefaultDateForMonth(monthKey));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingExpense) {
        setTitle(editingExpense.title);
        setAmountStr(String(editingExpense.amount));
        setCategory(editingExpense.category);
        setDate(editingExpense.date);
        setPaymentMethod(editingExpense.paymentMethod);
        setNote(editingExpense.note || '');
      } else {
        setTitle('');
        setAmountStr('');
        setCategory('groceries');
        setDate(getDefaultDateForMonth(monthKey));
        setPaymentMethod('cash');
        setNote('');
      }
    }
  }, [open, editingExpense, monthKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(amountStr);
    if (!title.trim() || !Number.isFinite(numeric) || numeric <= 0) return;
    setSaving(true);
    try {
      await onSave(
        {
          title: title.trim(),
          amount: numeric,
          category,
          date,
          paymentMethod,
          note: note.trim(),
        },
        editingExpense?.id,
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const categories = Object.keys(CATEGORY_META) as ExpenseCategory[];

  return (
    <SheetContainer
      open={open}
      onClose={onClose}
      title={
        editingExpense
          ? pickText(language, { roman_urdu: 'Kharch Badlein', english: 'Edit Expense' })
          : pickText(language, { roman_urdu: 'Naya Kharch Likhein', english: 'Add Daily Expense' })
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!editingExpense && (
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">
              {pickText(language, { roman_urdu: 'Jaldi Chunein', english: 'Quick Presets' })}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_EXPENSE_PRESETS.map((preset) => (
                <button
                  key={preset.title.english}
                  type="button"
                  onClick={() => {
                    setTitle(pickText(language, preset.title, ' / '));
                    setCategory(preset.category);
                  }}
                  className="min-h-[34px] px-3 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 cursor-pointer"
                >
                  {pickText(language, preset.title, ' / ')}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            {pickText(language, { roman_urdu: 'Kharch ki Tafseel', english: 'Expense Title' })}
          </label>
          <input
            type="text"
            required
            maxLength={FIELD_LIMITS.EXPENSE_TITLE_MAX}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={pickText(language, {
              roman_urdu: 'Jaise: Doodh, Bijli Bill, Petrol',
              english: 'e.g. Milk, Electricity Bill, Fuel',
            })}
            className="w-full min-h-[44px] px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {pickText(language, {
                roman_urdu: `Raqam (${CURRENCY_SYMBOL[currency]})`,
                english: `Amount (${CURRENCY_SYMBOL[currency]})`,
              })}
            </label>
            <input
              type="number"
              inputMode="decimal"
              min={1}
              max={FIELD_LIMITS.MAX_AMOUNT}
              step="any"
              required
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="500"
              className="w-full min-h-[44px] px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {pickText(language, { roman_urdu: 'Tareekh', english: 'Date' })}
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            {pickText(language, { roman_urdu: 'Qism / Category', english: 'Category' })}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {pickText(language, CATEGORY_META[cat], ' · ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            {pickText(language, { roman_urdu: 'Adaigi ka Tareeqa', english: 'Payment Method' })}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['cash', 'bank', 'wallet'] as PaymentMethod[]).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`min-h-[42px] px-2 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  paymentMethod === method
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {pickText(language, PAYMENT_META[method], ' / ')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            {pickText(language, { roman_urdu: 'Mazeed Note (Ikhtiyari)', english: 'Note (Optional)' })}
          </label>
          <input
            type="text"
            maxLength={FIELD_LIMITS.EXPENSE_NOTE_MAX}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={pickText(language, {
              roman_urdu: 'Koi zaroori baat likhein...',
              english: 'Optional details...',
            })}
            className="w-full min-h-[44px] px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
          />
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
          >
            {pickText(language, { roman_urdu: 'Band Karein', english: 'Cancel' })}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold disabled:opacity-60 cursor-pointer"
          >
            {saving
              ? pickText(language, { roman_urdu: 'Mehfooz ho raha hai...', english: 'Saving...' })
              : editingExpense
                ? pickText(language, { roman_urdu: 'Update Karein', english: 'Update' })
                : pickText(language, { roman_urdu: 'Kharch Darj Karein', english: 'Save Expense' })}
          </button>
        </div>
      </form>
    </SheetContainer>
  );
}

export function GrocerySheet({
  open,
  onClose,
  editingGrocery,
  language,
  currency,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  editingGrocery: GroceryItem | null;
  language: LanguageMode;
  currency: CurrencyCode;
  onSave: (
    payload: {
      name: string;
      unit: GroceryUnit;
      plannedQty: number;
      consumedQty: number;
      unitPrice: number;
      purchased: boolean;
      note: string;
    },
    editingId?: string,
  ) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<GroceryUnit>('kg');
  const [plannedStr, setPlannedStr] = useState('1');
  const [consumedStr, setConsumedStr] = useState('0');
  const [priceStr, setPriceStr] = useState('0');
  const [purchased, setPurchased] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingGrocery) {
        setName(editingGrocery.name);
        setUnit(editingGrocery.unit);
        setPlannedStr(String(editingGrocery.plannedQty));
        setConsumedStr(String(editingGrocery.consumedQty));
        setPriceStr(String(editingGrocery.unitPrice));
        setPurchased(editingGrocery.purchased);
        setNote(editingGrocery.note || '');
      } else {
        setName('');
        setUnit('kg');
        setPlannedStr('5');
        setConsumedStr('0');
        setPriceStr('0');
        setPurchased(false);
        setNote('');
      }
    }
  }, [open, editingGrocery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(
        {
          name: name.trim(),
          unit,
          plannedQty: Math.max(0, Number(plannedStr) || 0),
          consumedQty: Math.max(0, Number(consumedStr) || 0),
          unitPrice: Math.max(0, Number(priceStr) || 0),
          purchased,
          note: note.trim(),
        },
        editingGrocery?.id,
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const units = Object.keys(UNIT_META) as GroceryUnit[];

  return (
    <SheetContainer
      open={open}
      onClose={onClose}
      title={
        editingGrocery
          ? pickText(language, { roman_urdu: 'Ration Item Badlein', english: 'Edit Grocery Item' })
          : pickText(language, { roman_urdu: 'Naya Ration Item', english: 'Add Grocery Item' })
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            {pickText(language, { roman_urdu: 'Cheez ka Naam', english: 'Item Name' })}
          </label>
          <input
            type="text"
            required
            maxLength={FIELD_LIMITS.GROCERY_NAME_MAX}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={pickText(language, {
              roman_urdu: 'Jaise: Chakki Atta, Chawal, Cooking Oil',
              english: 'e.g. Wheat Flour, Basmati Rice, Cooking Oil',
            })}
            className="w-full min-h-[44px] px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {pickText(language, { roman_urdu: 'Paimana / Unit', english: 'Unit' })}
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as GroceryUnit)}
              className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
            >
              {units.map((u) => (
                <option key={u} value={u}>
                  {pickText(language, UNIT_META[u], ' / ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {pickText(language, {
                roman_urdu: `Kul Qeemat (${CURRENCY_SYMBOL[currency]})`,
                english: `Total Cost (${CURRENCY_SYMBOL[currency]})`,
              })}
            </label>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={FIELD_LIMITS.MAX_PRICE}
              step="any"
              value={priceStr}
              onChange={(e) => setPriceStr(e.target.value)}
              className="w-full min-h-[44px] px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {pickText(language, {
                roman_urdu: 'Maheene ka Hadaf (Miqdaar)',
                english: 'Planned Monthly Qty',
              })}
            </label>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={FIELD_LIMITS.MAX_QTY}
              step="any"
              required
              value={plannedStr}
              onChange={(e) => setPlannedStr(e.target.value)}
              className="w-full min-h-[44px] px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {pickText(language, {
                roman_urdu: 'Istemaal Shuda Miqdaar',
                english: 'Consumed Qty',
              })}
            </label>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={FIELD_LIMITS.MAX_QTY}
              step="any"
              required
              value={consumedStr}
              onChange={(e) => setConsumedStr(e.target.value)}
              className="w-full min-h-[44px] px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 min-h-[44px] px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
          <input
            type="checkbox"
            checked={purchased}
            onChange={(e) => setPurchased(e.target.checked)}
            className="w-4 h-4 accent-emerald-700 rounded"
          />
          <span className="text-sm font-medium text-slate-800">
            {pickText(language, {
              roman_urdu: 'Yeh cheez khareed li gayi hai',
              english: 'Already purchased this month',
            })}
          </span>
        </label>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            {pickText(language, { roman_urdu: 'Note (Ikhtiyari)', english: 'Note (Optional)' })}
          </label>
          <input
            type="text"
            maxLength={FIELD_LIMITS.GROCERY_NOTE_MAX}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={pickText(language, {
              roman_urdu: 'Brand ya dukan ka naam...',
              english: 'Brand or store note...',
            })}
            className="w-full min-h-[44px] px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
          />
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
          >
            {pickText(language, { roman_urdu: 'Band Karein', english: 'Cancel' })}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold disabled:opacity-60 cursor-pointer"
          >
            {saving
              ? pickText(language, { roman_urdu: 'Mehfooz ho raha hai...', english: 'Saving...' })
              : editingGrocery
                ? pickText(language, { roman_urdu: 'Update Karein', english: 'Update' })
                : pickText(language, { roman_urdu: 'Item Shamil Karein', english: 'Add Item' })}
          </button>
        </div>
      </form>
    </SheetContainer>
  );
}
