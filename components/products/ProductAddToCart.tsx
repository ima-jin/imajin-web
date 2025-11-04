'use client';

import { useState } from 'react';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import type { CartItem } from '@/types/cart';

interface Variant {
  id: string;
  stripePriceId: string; // Stripe Price ID for checkout
  variantValue: string;
  priceModifier: number;
  availableQuantity: number | null;
  isAvailable: boolean;
}

interface ProductAddToCartProps {
  product: {
    id: string;
    name: string;
    basePrice: number;
    image?: string;
    voltage?: '5v' | '24v';
    variants?: Variant[];
    sellStatus?: string;
  };
}

export function ProductAddToCart({ product }: ProductAddToCartProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    product.variants && product.variants.length > 0 ? product.variants[0].id : undefined
  );
  const [quantity, setQuantity] = useState(1);

  // Find selected variant
  const selectedVariant = product.variants?.find(v => v.id === selectedVariantId);

  // Calculate final price
  const finalPrice = product.basePrice + (selectedVariant?.priceModifier || 0);

  // Build cart item
  const cartItem: Omit<CartItem, 'quantity'> = {
    productId: product.id,
    variantId: selectedVariantId,
    name: selectedVariant
      ? `${product.name} - ${selectedVariant.variantValue}`
      : product.name,
    price: finalPrice,
    stripePriceId: selectedVariant?.stripePriceId || '', // Stripe Price ID from variant
    image: product.image || '/placeholder.jpg',
    voltage: product.voltage,
    isLimitedEdition: !!selectedVariant,
    remainingQuantity: selectedVariant?.availableQuantity || undefined,
    variantName: selectedVariant?.variantValue,
  };

  // Check if selected variant is out of stock
  const isOutOfStock = selectedVariant && !selectedVariant.isAvailable;

  return (
    <div className="space-y-4">
      {/* Variant Selector */}
      {product.variants && product.variants.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Color:
          </label>
          <select
            value={selectedVariantId}
            onChange={(e) => setSelectedVariantId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {product.variants.map((variant) => (
              <option
                key={variant.id}
                value={variant.id}
                disabled={!variant.isAvailable}
              >
                {variant.variantValue}
                {variant.availableQuantity !== null && (
                  ` (${variant.availableQuantity} remaining)`
                )}
                {!variant.isAvailable && ' - Sold Out'}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Quantity Selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Quantity:
        </label>
        <input
          type="number"
          min="1"
          max={selectedVariant?.availableQuantity || 999}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-24 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Low Stock Warning */}
      {selectedVariant && selectedVariant.availableQuantity !== null && selectedVariant.availableQuantity <= 10 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            Only {selectedVariant.availableQuantity} units remaining!
          </p>
        </div>
      )}

      {/* Add to Cart Button */}
      {isOutOfStock ? (
        <button
          disabled
          className="w-full bg-gray-300 text-gray-500 font-semibold py-3 px-6 rounded-lg cursor-not-allowed"
        >
          Sold Out
        </button>
      ) : (
        <AddToCartButton
          product={cartItem}
          quantity={quantity}
          className="w-full"
          size="lg"
          buttonText={product.sellStatus === 'pre-order' ? 'Pre-Order' : 'Add to Cart'}
        />
      )}
    </div>
  );
}
