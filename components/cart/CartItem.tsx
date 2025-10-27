'use client';

import type { CartItem } from '@/types/cart';
import type { UIStrings } from '@/config/schema/ui-strings-schema';
import { formatCurrency } from '@/lib/utils/format';
import { Badge } from '@/components/ui/Badge';
import { interpolate } from '@/lib/utils/string-template';

interface CartItemProps {
  item: CartItem;
  uiStrings: UIStrings;
  onUpdateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  onRemove: (productId: string, variantId: string | undefined) => void;
}

export function CartItem({ item, uiStrings, onUpdateQuantity, onRemove }: CartItemProps) {
  const cartItemStrings = uiStrings.cart_item;
  const lineTotal = item.price * item.quantity;
  const isAtMinQuantity = item.quantity <= 1;
  const isAtMaxQuantity = item.isLimitedEdition && item.remainingQuantity !== undefined
    ? item.quantity >= item.remainingQuantity
    : false;

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (value > 0) {
      onUpdateQuantity(item.productId, item.variantId, value);
    }
  };

  const handleIncrement = () => {
    onUpdateQuantity(item.productId, item.variantId, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.productId, item.variantId, item.quantity - 1);
    }
  };

  const handleRemove = () => {
    onRemove(item.productId, item.variantId);
  };

  return (
    <div className="flex gap-4 py-4 border-b last:border-b-0">
      {/* Product Image Placeholder */}
      <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
        <span className="text-xs text-gray-400">Image</span>
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-medium text-sm">{item.name}</h3>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-1">
              {item.isLimitedEdition && (
                <Badge variant="limited" size="sm">
                  {cartItemStrings.limited_edition_badge}
                </Badge>
              )}
              {item.voltage && (
                <Badge variant="voltage" size="sm">
                  {item.voltage}
                </Badge>
              )}
            </div>

            {/* Remaining Quantity Warning */}
            {item.isLimitedEdition && item.remainingQuantity !== undefined && item.remainingQuantity <= 10 && (
              <p className="text-xs text-amber-600 mt-1">
                {interpolate(cartItemStrings.low_stock_template, { quantity: item.remainingQuantity })}
              </p>
            )}

            {/* Unit Price */}
            <p className="text-sm text-gray-600 mt-1">
              {formatCurrency(item.price)}
            </p>
          </div>

          {/* Line Total */}
          <div className="text-right">
            <p className="font-medium text-sm">
              {formatCurrency(lineTotal)}
            </p>
          </div>
        </div>

        {/* Quantity Controls & Remove Button */}
        <div className="flex items-center gap-3 mt-3">
          {/* Quantity Controls */}
          <div className="flex items-center border border-gray-300 rounded">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={isAtMinQuantity}
              aria-label={cartItemStrings.aria.decrease_quantity}
              className="px-3 py-1 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              −
            </button>
            <input
              type="number"
              min="1"
              value={item.quantity}
              onChange={handleQuantityChange}
              className="w-12 text-center border-x border-gray-300 py-1 text-sm"
              aria-label={cartItemStrings.quantity_label}
            />
            <button
              type="button"
              onClick={handleIncrement}
              disabled={isAtMaxQuantity}
              aria-label={cartItemStrings.aria.increase_quantity}
              className="px-3 py-1 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>

          {/* Remove Button */}
          <button
            type="button"
            onClick={handleRemove}
            aria-label={cartItemStrings.aria.remove_item}
            className="text-sm text-red-600 hover:text-red-700"
          >
            {cartItemStrings.remove_label}
          </button>
        </div>
      </div>
    </div>
  );
}
