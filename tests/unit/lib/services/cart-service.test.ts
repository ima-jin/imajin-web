import { describe, it, expect } from 'vitest';
import {
  addItemToCart,
  removeItemFromCart,
  updateItemQuantity,
  clearCart,
  getCartItemCount,
  getCartSubtotal,
  getCartItemKey,
  findCartItem,
} from '@/lib/services/cart-service';
import type { CartItem } from '@/lib/services/cart-service';

const mockItem: CartItem = {
  productId: 'prod-1',
  name: 'Test Product',
  image: '/test.jpg',
  quantity: 1,
  price: 1000,
};

describe('Cart Service', () => {
  describe('addItemToCart', () => {
    it('should add new item to empty cart', () => {
      const cart = addItemToCart([], mockItem);
      expect(cart).toHaveLength(1);
      expect(cart[0]).toEqual(mockItem);
    });

    it('should add new item to existing cart', () => {
      const existing: CartItem = {
        productId: 'prod-2',
        name: 'Other Product',
        image: '/test2.jpg',
        quantity: 1,
        price: 500,
      };
      const cart = addItemToCart([existing], mockItem);
      expect(cart).toHaveLength(2);
    });

    it('should update quantity if item already exists', () => {
      const cart = addItemToCart([mockItem], { ...mockItem, quantity: 2 });
      expect(cart).toHaveLength(1);
      expect(cart[0].quantity).toBe(3);
    });

    it('should treat different variants as separate items', () => {
      const blackVariant = { ...mockItem, variantId: 'black' };
      const whiteVariant = { ...mockItem, variantId: 'white' };
      const cart = addItemToCart([blackVariant], whiteVariant);
      expect(cart).toHaveLength(2);
    });
  });

  describe('removeItemFromCart', () => {
    it('should remove item from cart', () => {
      const cart = removeItemFromCart([mockItem], 'prod-1');
      expect(cart).toHaveLength(0);
    });

    it('should remove correct item when multiple exist', () => {
      const item2: CartItem = {
        productId: 'prod-2',
        name: 'Other',
        image: '/test2.jpg',
        quantity: 1,
        price: 500,
      };
      const cart = removeItemFromCart([mockItem, item2], 'prod-1');
      expect(cart).toHaveLength(1);
      expect(cart[0].productId).toBe('prod-2');
    });

    it('should handle removing non-existent item', () => {
      const cart = removeItemFromCart([mockItem], 'nonexistent');
      expect(cart).toHaveLength(1);
    });
  });

  describe('updateItemQuantity', () => {
    it('should update item quantity', () => {
      const cart = updateItemQuantity([mockItem], 'prod-1', 5);
      expect(cart[0].quantity).toBe(5);
    });

    it('should only update specified item', () => {
      const item2: CartItem = {
        productId: 'prod-2',
        name: 'Other',
        image: '/test2.jpg',
        quantity: 2,
        price: 500,
      };
      const cart = updateItemQuantity([mockItem, item2], 'prod-1', 10);
      expect(cart[0].quantity).toBe(10);
      expect(cart[1].quantity).toBe(2);
    });
  });

  describe('clearCart', () => {
    it('should return empty array', () => {
      const cart = clearCart();
      expect(cart).toEqual([]);
    });
  });

  describe('getCartItemCount', () => {
    it('should return 0 for empty cart', () => {
      expect(getCartItemCount([])).toBe(0);
    });

    it('should sum quantities', () => {
      const items: CartItem[] = [
        { ...mockItem, quantity: 2 },
        { ...mockItem, productId: 'prod-2', quantity: 3 },
      ];
      expect(getCartItemCount(items)).toBe(5);
    });
  });

  describe('getCartSubtotal', () => {
    it('should calculate subtotal', () => {
      const items: CartItem[] = [
        { ...mockItem, price: 1000, quantity: 2 },
        { ...mockItem, productId: 'prod-2', price: 500, quantity: 3 },
      ];
      expect(getCartSubtotal(items)).toBe(3500); // (1000*2) + (500*3)
    });

    it('should return 0 for empty cart', () => {
      expect(getCartSubtotal([])).toBe(0);
    });
  });

  describe('getCartItemKey', () => {
    it('should generate key with variant', () => {
      expect(getCartItemKey('prod-1', 'black')).toBe('prod-1-black');
    });

    it('should generate key without variant', () => {
      expect(getCartItemKey('prod-1')).toBe('prod-1-default');
    });
  });

  describe('findCartItem', () => {
    it('should find item by product ID', () => {
      const item = findCartItem([mockItem], 'prod-1');
      expect(item).toEqual(mockItem);
    });

    it('should find item by product ID and variant', () => {
      const variantItem = { ...mockItem, variantId: 'black' };
      const item = findCartItem([variantItem], 'prod-1', 'black');
      expect(item).toEqual(variantItem);
    });

    it('should return undefined if not found', () => {
      const item = findCartItem([mockItem], 'nonexistent');
      expect(item).toBeUndefined();
    });
  });
});
