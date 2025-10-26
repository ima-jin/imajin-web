'use client';

import { useCart } from './CartProvider';
import { formatCurrency } from '@/lib/utils/format';

export function CartSummary() {
  const { subtotal, itemCount } = useCart();

  // Tax/shipping calculated at checkout (Phase 2.4)

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">
          Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </span>
        <span className="font-medium">{formatCurrency(subtotal)}</span>
      </div>

      <div className="flex justify-between text-sm text-gray-600">
        <span>Shipping</span>
        <span>Calculated at checkout</span>
      </div>

      <div className="flex justify-between text-lg font-bold pt-2 border-t">
        <span>Total</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
    </div>
  );
}
