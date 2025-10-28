'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { formatCurrency } from '@/lib/utils/format';
import type { CartItem } from '@/types/cart';
import Image from 'next/image';

interface OrderSummaryProps {
  items: CartItem[];
}

/**
 * OrderSummary Component
 *
 * Displays order summary with items, pricing breakdown, and totals.
 * Used on checkout page to show cart contents before payment.
 */
export function OrderSummary({ items }: OrderSummaryProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card noPadding>
      <CardHeader>
        <Heading level={3} className="text-lg font-semibold">
          Order Summary
        </Heading>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Items List */}
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantId || 'default'}`}
              className="flex gap-4"
            >
              <div className="relative w-16 h-16 flex-shrink-0 rounded border border-gray-200 overflow-hidden bg-gray-50">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>

              <div className="flex-1 min-w-0">
                <Text size="sm" className="font-medium mb-1 line-clamp-2">
                  {item.name}
                </Text>
                {item.variantName && (
                  <Text size="caption" color="muted" className="mb-1">
                    {item.variantName}
                  </Text>
                )}
                <Text size="caption" color="muted">
                  Qty: {item.quantity}
                </Text>
              </div>

              <div className="flex-shrink-0">
                <Text size="sm" className="font-medium">
                  {formatCurrency(item.price * item.quantity)}
                </Text>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Pricing Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <Text color="muted">
              Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </Text>
            <Text className="font-medium">{formatCurrency(subtotal)}</Text>
          </div>

          <div className="flex justify-between text-sm">
            <Text color="muted">Shipping</Text>
            <Text className="font-medium">Calculated at checkout</Text>
          </div>

          <div className="flex justify-between text-sm">
            <Text color="muted">Tax</Text>
            <Text className="font-medium">Calculated at checkout</Text>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Total */}
        <div className="flex justify-between">
          <Heading level={4} className="text-lg">
            Total
          </Heading>
          <Heading level={4} className="text-lg">
            {formatCurrency(subtotal)}
          </Heading>
        </div>

        <Text size="caption" color="muted" className="text-center">
          Final total including shipping and tax will be calculated by Stripe
        </Text>
      </CardContent>
    </Card>
  );
}
