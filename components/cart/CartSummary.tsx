'use client';

import { useCart } from './CartProvider';
import { formatCurrency } from '@/lib/utils/format';
import type { UIStrings } from '@/config/schema/ui-strings-schema';

interface CartSummaryProps {
  uiStrings: UIStrings;
}

export function CartSummary({ uiStrings }: CartSummaryProps) {
  const { subtotal, itemCount } = useCart();
  const summaryStrings = uiStrings.cart.summary;
  const itemCountStrings = uiStrings.cart.item_count;
  const itemCountLabel = itemCount === 1 ? itemCountStrings.singular : itemCountStrings.plural;

  // Tax/shipping calculated at checkout (Phase 2.4)

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">
          {summaryStrings.subtotal} ({itemCount} {itemCountLabel})
        </span>
        <span className="font-medium">{formatCurrency(subtotal)}</span>
      </div>

      <div className="flex justify-between text-sm text-gray-600">
        <span>{summaryStrings.shipping}</span>
        <span>{summaryStrings.shipping_calculated}</span>
      </div>

      <div className="flex justify-between text-lg font-bold pt-2 border-t">
        <span>{summaryStrings.total}</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
    </div>
  );
}
