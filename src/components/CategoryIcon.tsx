import {
  Fuel,
  GraduationCap,
  HeartPulse,
  Receipt,
  ShoppingBag,
  ShoppingBasket,
  Utensils,
  Zap,
} from 'lucide-react';
import { CATEGORY_META } from '../i18n/dictionary';
import type { ExpenseCategory } from '../types/expense';

export function CategoryIcon({
  category,
  size = 18,
  className = '',
}: {
  category: ExpenseCategory;
  size?: number;
  className?: string;
}) {
  const meta = CATEGORY_META[category];

  const renderIcon = () => {
    switch (category) {
      case 'groceries':
        return <ShoppingBasket size={size} aria-hidden="true" />;
      case 'utilities':
        return <Zap size={size} aria-hidden="true" />;
      case 'transport':
        return <Fuel size={size} aria-hidden="true" />;
      case 'dining':
        return <Utensils size={size} aria-hidden="true" />;
      case 'health':
        return <HeartPulse size={size} aria-hidden="true" />;
      case 'education':
        return <GraduationCap size={size} aria-hidden="true" />;
      case 'shopping':
        return <ShoppingBag size={size} aria-hidden="true" />;
      default:
        return <Receipt size={size} aria-hidden="true" />;
    }
  };

  return (
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.accentBg} ${meta.accentText} ${className}`}
    >
      {renderIcon()}
    </div>
  );
}
