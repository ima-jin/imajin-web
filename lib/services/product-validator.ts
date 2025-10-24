import { ProductConfigSchema } from "@/config/schema";
import type { Variant, VariantAvailability } from "@/types/product";

/**
 * Validate product JSON configuration
 */
export function validateProductJson(data: unknown) {
  return ProductConfigSchema.safeParse(data);
}

/**
 * Validate variant availability
 * Returns information about whether a variant is available for purchase
 */
export function validateVariantAvailability(variant: Variant): VariantAvailability {
  return {
    variantId: variant.id,
    isAvailable: variant.isAvailable ?? false,
    availableQuantity: variant.availableQuantity,
    maxQuantity: variant.maxQuantity,
    soldQuantity: variant.soldQuantity ?? 0,
  };
}

/**
 * Check if a variant has low stock
 * Returns true if available quantity is below threshold (or 10% of max quantity)
 */
export function isLowStock(variant: Variant, threshold: number = 10): boolean {
  if (!variant.isLimitedEdition || variant.maxQuantity === null) {
    return false;
  }

  const availableQty = variant.availableQuantity || 0;
  const percentageThreshold = Math.max(threshold, variant.maxQuantity * 0.1);

  return availableQty > 0 && availableQty <= percentageThreshold;
}

/**
 * Check if a variant is sold out
 */
export function isSoldOut(variant: Variant): boolean {
  return !variant.isAvailable;
}
