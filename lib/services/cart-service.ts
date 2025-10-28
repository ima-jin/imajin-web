/**
 * Cart Service
 *
 * Business logic for cart operations.
 * Extracted from CartProvider to improve testability and reusability.
 */

import { calculateSubtotal } from '@/lib/utils/price';
import type { CartItem } from '@/types/cart';

export type { CartItem };

/**
 * Adds an item to cart or updates quantity if already exists
 */
export function addItemToCart(
  cart: CartItem[],
  item: CartItem
): CartItem[] {
  const existingIndex = cart.findIndex(
    (i) =>
      i.productId === item.productId &&
      (i.variantId || 'default') === (item.variantId || 'default')
  );

  if (existingIndex >= 0) {
    // Item exists, update quantity
    const updated = [...cart];
    updated[existingIndex] = {
      ...updated[existingIndex],
      quantity: updated[existingIndex].quantity + item.quantity,
    };
    return updated;
  }

  // New item, add to cart
  return [...cart, item];
}

/**
 * Removes an item from cart
 */
export function removeItemFromCart(
  cart: CartItem[],
  productId: string,
  variantId?: string
): CartItem[] {
  return cart.filter(
    (item) =>
      !(
        item.productId === productId &&
        (item.variantId || 'default') === (variantId || 'default')
      )
  );
}

/**
 * Updates quantity for an item in cart
 */
export function updateItemQuantity(
  cart: CartItem[],
  productId: string,
  quantity: number,
  variantId?: string
): CartItem[] {
  return cart.map((item) =>
    item.productId === productId &&
    (item.variantId || 'default') === (variantId || 'default')
      ? { ...item, quantity }
      : item
  );
}

/**
 * Clears all items from cart
 */
export function clearCart(): CartItem[] {
  return [];
}

/**
 * Gets cart item count (total quantities)
 */
export function getCartItemCount(cart: CartItem[]): number {
  return cart.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Gets cart subtotal (in cents)
 */
export function getCartSubtotal(cart: CartItem[]): number {
  return calculateSubtotal(cart);
}

/**
 * Generates unique key for cart item
 */
export function getCartItemKey(productId: string, variantId?: string): string {
  return `${productId}-${variantId || 'default'}`;
}

/**
 * Finds item in cart
 */
export function findCartItem(
  cart: CartItem[],
  productId: string,
  variantId?: string
): CartItem | undefined {
  return cart.find(
    (item) =>
      item.productId === productId &&
      (item.variantId || 'default') === (variantId || 'default')
  );
}
