import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { Text } from "@/components/ui/Text";
import {
  getProductDisplayStatus,
  getDisplayPrice,
  getDepositAmount
} from "@/lib/utils/product-display";
import type { Product, Variant } from "@/types/product";
import type { ProductDetailContent } from "@/config/schema/page-content-schema";

/**
 * PriceDisplay Component Props
 */
interface PriceDisplayProps {
  product: {
    id: string;
    sellStatus: string;
    basePrice: number;
    wholesalePriceCents?: number;
    presaleDepositPriceCents?: number;
  };
  variant: 'card' | 'detail';
  selectedVariant?: Variant; // Optional variant for price calculation
  userHasPaidDeposit?: boolean;
  content?: ProductDetailContent; // Optional content overrides
}

/**
 * PriceDisplay Component
 *
 * Reusable component for displaying product pricing with conditional logic.
 * Handles pre-sale deposits, wholesale pricing, and standard pricing display.
 *
 * Supports two layout variants:
 * - "card": Compact layout for product cards
 * - "detail": Expanded layout for product detail pages
 *
 * @example
 * ```tsx
 * // Card variant (compact)
 * <PriceDisplay product={product} variant="card" />
 *
 * // Detail variant (expanded)
 * <PriceDisplay product={product} variant="detail" userHasPaidDeposit={true} />
 * ```
 */
export function PriceDisplay({
  product,
  variant,
  selectedVariant,
  userHasPaidDeposit = false,
  content
}: PriceDisplayProps) {
  // Handle internal products first (no pricing shown)
  if (product.sellStatus === 'internal') {
    const fallbackMessage = variant === 'detail'
      ? 'Pricing will be available soon'
      : 'Pricing available soon';

    return (
      <Text size="sm" color="muted">
        {fallbackMessage}
      </Text>
    );
  }

  // Get pricing information using existing utilities
  const displayStatus = getProductDisplayStatus(product as Product);
  const displayPrice = getDisplayPrice(product as Product, selectedVariant, userHasPaidDeposit);
  const depositAmount = getDepositAmount(product as Product, selectedVariant);

  // Determine styling based on variant
  const priceSize = variant === 'detail' ? 'xl' : 'lg';
  const priceClassName = variant === 'detail' ? 'text-3xl' : '';

  // Pre-sale: Show deposit amount with badge
  if (product.sellStatus === 'pre-sale' && depositAmount !== null) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="voltage" size="sm">
            Deposit
          </Badge>
          <Price amount={depositAmount} size={priceSize} className={priceClassName} />
        </div>
        <Text size="caption" color="muted">
          Refundable deposit to secure wholesale pricing
        </Text>
      </div>
    );
  }

  // Pre-order or For-sale: Show price
  if (displayPrice) {
    return (
      <div className="flex items-baseline gap-2">
        <Price amount={displayPrice.price} size={priceSize} className={priceClassName} />
        {displayPrice.type === 'wholesale' && (
          <Badge variant="success" size="sm">
            Wholesale
          </Badge>
        )}
        {displayStatus.message && (
          <span className="text-xs text-gray-600">
            ({displayStatus.message})
          </span>
        )}
      </div>
    );
  }

  // Fallback: Price hidden (internal products or pricing not available)
  const fallbackMessage = variant === 'detail'
    ? 'Pricing will be available soon'
    : 'Pricing available soon';

  return (
    <Text size="sm" color="muted">
      {fallbackMessage}
    </Text>
  );
}
