import type {
  CurrencyCode,
  ExpenseCategory,
  GroceryUnit,
  LanguageMode,
  PaymentMethod,
} from '../types/expense';
import { CURRENCY_SYMBOL } from '../types/expense';

export interface BilingualText {
  roman_urdu: string;
  english: string;
}

export function pickText(mode: LanguageMode, text: BilingualText, separator = ' · '): string {
  if (mode === 'roman_urdu') return text.roman_urdu;
  if (mode === 'english') return text.english;
  if (text.roman_urdu.toLowerCase() === text.english.toLowerCase()) {
    return text.english;
  }
  return `${text.roman_urdu}${separator}${text.english}`;
}

export const CATEGORY_META: Record<
  ExpenseCategory,
  {
    roman_urdu: string;
    english: string;
    accentBg: string;
    accentText: string;
    barColor: string;
  }
> = {
  groceries: {
    roman_urdu: 'Ration aur Sabzi',
    english: 'Groceries',
    accentBg: 'bg-emerald-50',
    accentText: 'text-emerald-700',
    barColor: 'bg-emerald-600',
  },
  utilities: {
    roman_urdu: 'Bills aur Kiraya',
    english: 'Bills & Rent',
    accentBg: 'bg-sky-50',
    accentText: 'text-sky-700',
    barColor: 'bg-sky-600',
  },
  transport: {
    roman_urdu: 'Safar aur Petrol',
    english: 'Transport & Fuel',
    accentBg: 'bg-amber-50',
    accentText: 'text-amber-700',
    barColor: 'bg-amber-600',
  },
  dining: {
    roman_urdu: 'Khana Peena',
    english: 'Food & Dining',
    accentBg: 'bg-orange-50',
    accentText: 'text-orange-700',
    barColor: 'bg-orange-600',
  },
  health: {
    roman_urdu: 'Sehat aur Dawai',
    english: 'Health & Medicine',
    accentBg: 'bg-rose-50',
    accentText: 'text-rose-700',
    barColor: 'bg-rose-600',
  },
  education: {
    roman_urdu: 'Taleem aur Ghar',
    english: 'Education & Home',
    accentBg: 'bg-indigo-50',
    accentText: 'text-indigo-700',
    barColor: 'bg-indigo-600',
  },
  shopping: {
    roman_urdu: 'Kapre aur Shopping',
    english: 'Shopping',
    accentBg: 'bg-teal-50',
    accentText: 'text-teal-700',
    barColor: 'bg-teal-600',
  },
  other: {
    roman_urdu: 'Deegar Kharch',
    english: 'Other',
    accentBg: 'bg-slate-100',
    accentText: 'text-slate-700',
    barColor: 'bg-slate-600',
  },
};

export const PAYMENT_META: Record<PaymentMethod, BilingualText> = {
  cash: { roman_urdu: 'Naqad', english: 'Cash' },
  bank: { roman_urdu: 'Bank / Card', english: 'Bank / Card' },
  wallet: { roman_urdu: 'Easypaisa / JazzCash', english: 'Mobile Wallet' },
};

export const UNIT_META: Record<GroceryUnit, BilingualText> = {
  kg: { roman_urdu: 'kg', english: 'kg' },
  g: { roman_urdu: 'gram', english: 'g' },
  litre: { roman_urdu: 'litre', english: 'litre' },
  ml: { roman_urdu: 'ml', english: 'ml' },
  pack: { roman_urdu: 'packet', english: 'pack' },
  dozen: { roman_urdu: 'darjan', english: 'dozen' },
  piece: { roman_urdu: 'adad', english: 'piece' },
};

export const QUICK_EXPENSE_PRESETS: Array<{
  title: BilingualText;
  category: ExpenseCategory;
}> = [
  { title: { roman_urdu: 'Sabzi aur Phal', english: 'Vegetables & Fruit' }, category: 'groceries' },
  { title: { roman_urdu: 'Doodh aur Dahi', english: 'Milk & Yogurt' }, category: 'groceries' },
  { title: { roman_urdu: 'Petrol / Bike', english: 'Fuel / Petrol' }, category: 'transport' },
  { title: { roman_urdu: 'Bijli ka Bill', english: 'Electricity Bill' }, category: 'utilities' },
  { title: { roman_urdu: 'Chai aur Nashta', english: 'Tea & Breakfast' }, category: 'dining' },
  { title: { roman_urdu: 'Dawai / Pharmacy', english: 'Medicine' }, category: 'health' },
];

export const COMMON_RATION_PACK: Array<{
  name: string;
  unit: GroceryUnit;
  plannedQty: number;
  unitPrice: number;
  note: string;
}> = [
  { name: 'Chakki Atta / Wheat Flour', unit: 'kg', plannedQty: 20, unitPrice: 2800, note: 'Monthly roti & paratha' },
  { name: 'Basmati Chawal / Rice', unit: 'kg', plannedQty: 10, unitPrice: 3200, note: 'Super kernel basmati' },
  { name: 'Cooking Oil / Ghee', unit: 'litre', plannedQty: 5, unitPrice: 2750, note: 'Pouches for kitchen' },
  { name: 'Cheeni / Sugar', unit: 'kg', plannedQty: 4, unitPrice: 640, note: 'Tea & desserts' },
  { name: 'Chai Patti / Black Tea', unit: 'pack', plannedQty: 2, unitPrice: 1700, note: '900g family packs' },
  { name: 'Fresh Doodh / Milk', unit: 'litre', plannedQty: 30, unitPrice: 6600, note: '1 litre daily' },
  { name: 'Daal Chana & Masoor / Lentils', unit: 'kg', plannedQty: 3, unitPrice: 1050, note: 'Weekly daal' },
  { name: 'Pyaz & Tamatar / Onions & Tomatoes', unit: 'kg', plannedQty: 8, unitPrice: 1200, note: 'Daily salan base' },
];

export function formatMoney(amount: number, currency: CurrencyCode = 'PKR'): string {
  const symbol = CURRENCY_SYMBOL[currency] || 'Rs.';
  const absVal = Math.abs(Math.round(amount));
  const formatted = absVal.toLocaleString('en-US');
  return amount < 0 ? `-${symbol} ${formatted}` : `${symbol} ${formatted}`;
}

export function formatMonthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) return monthKey;
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;
  const date = new Date(year, month + delta, 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getTodayDateStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDefaultDateForMonth(monthKey: string): string {
  const today = getTodayDateStr();
  if (today.startsWith(monthKey)) return today;
  return `${monthKey}-01`;
}

export function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}
