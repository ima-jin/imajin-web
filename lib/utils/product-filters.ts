/**
 * Product filtering and display utilities
 */

/**
 * Valid sell_status values from database schema
 */
export type SellStatus = 'for-sale' | 'pre-order' | 'sold-out' | 'internal';

/**
 * Product display status result
 */
export interface ProductDisplayStatus {
  label: string;
  canPurchase: boolean;
  note?: string;
}

/**
 * Determines if a product should be shown in public listings
 *
 * A product is shown when:
 * - is_live is true
 * - sell_status is one of: "for-sale", "pre-order", "sold-out"
 *
 * Products with is_live=false or sell_status="internal" are hidden.
 *
 * @param isLive - The is_live flag from the database
 * @param sellStatus - The sell_status value from the database
 * @returns true if product should be shown to public
 */
export function shouldShowProduct(
  isLive: boolean,
  sellStatus: SellStatus | null | undefined
): boolean {
  // Must be live
  if (!isLive) return false;

  // Must have valid sell_status
  if (!sellStatus) return false;

  // Show all statuses except internal
  const validStatuses: SellStatus[] = ['for-sale', 'pre-order', 'sold-out'];
  return validStatuses.includes(sellStatus);
}

/**
 * Gets the display status and purchase availability for a product
 *
 * Maps sell_status to human-readable labels and purchase capability:
 * - "for-sale" → "In Stock" (can purchase)
 * - "pre-order" → "Pre-Order" (can purchase)
 * - "sold-out" → "Sold Out" (cannot purchase)
 * - "internal" → "Not Available" (cannot purchase)
 *
 * @param sellStatus - The sell_status value from the database
 * @param sellStatusNote - Optional note explaining the status
 * @returns Display status with label, purchase flag, and optional note
 */
export function getProductDisplayStatus(
  sellStatus: SellStatus | null | undefined,
  sellStatusNote?: string | null
): ProductDisplayStatus {
  // Default to "internal" if missing or invalid
  const status = sellStatus || 'internal';

  // Map sell_status to display info
  const statusMap: Record<SellStatus, { label: string; canPurchase: boolean }> = {
    'for-sale': { label: 'In Stock', canPurchase: true },
    'pre-order': { label: 'Pre-Order', canPurchase: true },
    'sold-out': { label: 'Sold Out', canPurchase: false },
    'internal': { label: 'Not Available', canPurchase: false },
  };

  const displayInfo = statusMap[status] || statusMap['internal'];

  return {
    ...displayInfo,
    ...(sellStatusNote ? { note: sellStatusNote } : {}),
  };
}

/**
 * Checks if a product is ready for sale based on dev_status
 *
 * Only products with dev_status=5 are ready to sell.
 *
 * @param devStatus - The dev_status value from the database
 * @returns true if product is ready for sale (dev_status=5)
 */
export function isProductReady(devStatus: number): boolean {
  return devStatus === 5;
}
