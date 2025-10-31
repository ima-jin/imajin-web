/**
 * Product Display Utilities
 *
 * Helper functions for determining product visibility and display status
 * based on isLive, sellStatus, and inventory tracking
 */

import type { Product, SellStatus } from '@/types/product';

export interface ProductDisplayStatus {
  shouldShow: boolean;
  badge?: {
    text: string;
    variant: 'default' | 'error' | 'success' | 'voltage' | 'warning' | 'danger' | 'limited';
  };
  message?: string;
}

/**
 * Determines if a product should be shown to customers
 *
 * Products are shown if:
 * - isLive is true
 * - sellStatus is 'for-sale' or 'pre-order'
 * - devStatus is 5 (production ready)
 * - isActive is true
 *
 * @param product - The product to check
 * @returns True if product should be displayed to customers
 */
export function shouldShowProduct(product: Product): boolean {
  // Must be live and active
  if (!product.isLive || !product.isActive) {
    return false;
  }

  // Must be production ready
  if (product.devStatus !== 5) {
    return false;
  }

  // Must be for sale or pre-order
  if (product.sellStatus !== 'for-sale' && product.sellStatus !== 'pre-order') {
    return false;
  }

  return true;
}

/**
 * Get product display status with badge and message information
 *
 * @param product - The product to analyze
 * @returns Display status with badge and message info
 */
export function getProductDisplayStatus(product: Product): ProductDisplayStatus {
  // Check if product should be shown at all
  if (!shouldShowProduct(product)) {
    return {
      shouldShow: false,
      message: product.sellStatusNote || 'Product not available',
    };
  }

  // Sold out
  if (product.sellStatus === 'sold-out') {
    return {
      shouldShow: true,
      badge: {
        text: 'Sold Out',
        variant: 'danger',
      },
      message: product.sellStatusNote || 'This product is currently sold out',
    };
  }

  // Pre-order
  if (product.sellStatus === 'pre-order') {
    return {
      shouldShow: true,
      badge: {
        text: 'Pre-Order',
        variant: 'warning',
      },
      message: product.sellStatusNote || 'Available for pre-order',
    };
  }

  // Check inventory availability (if tracked)
  if (product.maxQuantity !== null && product.availableQuantity !== null) {
    // Sold out based on inventory
    if (product.availableQuantity <= 0) {
      return {
        shouldShow: true,
        badge: {
          text: 'Sold Out',
          variant: 'danger',
        },
        message: 'This product is currently sold out',
      };
    }

    // Low stock warning (less than 10 units or 10% of max, whichever is lower)
    const lowStockThreshold = Math.min(10, Math.floor(product.maxQuantity * 0.1));
    if (product.availableQuantity <= lowStockThreshold) {
      return {
        shouldShow: true,
        badge: {
          text: `Only ${product.availableQuantity} Left`,
          variant: 'warning',
        },
        message: product.sellStatusNote,
      };
    }
  }

  // For sale with no issues
  return {
    shouldShow: true,
    message: product.sellStatusNote,
  };
}

/**
 * Get a human-readable sell status label
 *
 * @param sellStatus - The sell status enum value
 * @returns Friendly label for display
 */
export function getSellStatusLabel(sellStatus: SellStatus): string {
  switch (sellStatus) {
    case 'for-sale':
      return 'Available';
    case 'pre-order':
      return 'Pre-Order';
    case 'sold-out':
      return 'Sold Out';
    case 'internal':
      return 'Internal Only';
    default:
      return 'Unavailable';
  }
}

/**
 * Get badge variant based on sell status
 *
 * @param sellStatus - The sell status enum value
 * @returns Badge variant for styling
 */
export function getSellStatusBadgeVariant(
  sellStatus: SellStatus
): 'default' | 'error' | 'success' | 'voltage' | 'warning' | 'danger' | 'limited' {
  switch (sellStatus) {
    case 'for-sale':
      return 'success';
    case 'pre-order':
      return 'warning';
    case 'sold-out':
      return 'danger';
    case 'internal':
      return 'default';
    default:
      return 'default';
  }
}

/**
 * Check if product can be added to cart
 *
 * @param product - The product to check
 * @returns True if product can be added to cart
 */
export function canAddToCart(product: Product): boolean {
  // Must be visible
  if (!shouldShowProduct(product)) {
    return false;
  }

  // Cannot add sold out products
  if (product.sellStatus === 'sold-out') {
    return false;
  }

  // Check inventory availability (if tracked)
  if (product.maxQuantity !== null && product.availableQuantity !== null) {
    if (product.availableQuantity <= 0) {
      return false;
    }
  }

  return true;
}

/**
 * Get available quantity message for display
 *
 * @param product - The product
 * @returns Message about availability, or undefined if unlimited/not tracked
 */
export function getAvailabilityMessage(product: Product): string | undefined {
  // If inventory isn't tracked, no message needed
  if (product.maxQuantity === null || product.availableQuantity === null) {
    return undefined;
  }

  // Sold out
  if (product.availableQuantity <= 0) {
    return 'Out of stock';
  }

  // Low stock (show count)
  const lowStockThreshold = Math.min(10, Math.floor(product.maxQuantity * 0.1));
  if (product.availableQuantity <= lowStockThreshold) {
    return `Only ${product.availableQuantity} remaining`;
  }

  // Plenty in stock (show general in stock message)
  return 'In stock';
}

/**
 * Filter products list to only show visible products
 *
 * @param products - Array of products to filter
 * @returns Filtered array of visible products
 */
export function filterVisibleProducts(products: Product[]): Product[] {
  return products.filter(shouldShowProduct);
}
