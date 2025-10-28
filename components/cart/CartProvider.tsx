'use client';

import { createContext, useContext, useState, useEffect, useLayoutEffect, ReactNode } from 'react';
import type { CartItem } from '@/types/cart';
import {
  addItemToCart,
  removeItemFromCart,
  updateItemQuantity as updateCartItemQuantity,
  clearCart as clearCartItems,
  getCartItemCount,
  getCartSubtotal,
} from '@/lib/services/cart-service';

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => Promise<void>;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  clearCart: () => void;
  isHydrated: boolean; // Important for SSR
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  // Always start with empty array to avoid hydration mismatch
  // Load from localStorage after mount in useEffect
  const [items, setItems] = useState<CartItem[]>([]);
  // Track if component has mounted (for SSR/hydration)
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage synchronously after mount to avoid hydration mismatch
  // useLayoutEffect runs synchronously after DOM mutations but before browser paint
  useLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      // Load cart from localStorage
      const stored = localStorage.getItem('imajin_cart');
      let initialItems: CartItem[] = [];

      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            initialItems = parsed;
          }
        } catch (error) {
          console.error('Failed to parse cart from localStorage:', error);
          localStorage.removeItem('imajin_cart');
        }
      }

      // Update state once with both items and hydration status
      if (initialItems.length > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage hydration is standard pattern
        setItems(initialItems);
      }
      setIsHydrated(true);
    }
  }, []);

  // Persist to localStorage on change (client-only)
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('imajin_cart', JSON.stringify(items));
    }
  }, [items, isHydrated]);

  // Calculate totals using cart service
  const itemCount = getCartItemCount(items);
  const subtotal = getCartSubtotal(items);

  // Add item to cart using cart service
  const addItem = async (newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const quantity = newItem.quantity || 1;
    const itemToAdd = { ...newItem, quantity } as CartItem;
    setItems((prev) => addItemToCart(prev, itemToAdd));
  };

  // Remove item from cart using cart service
  const removeItem = (productId: string, variantId?: string) => {
    setItems((prev) => removeItemFromCart(prev, productId, variantId));
  };

  // Update item quantity using cart service
  const updateQuantity = (productId: string, variantId: string | undefined, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }

    setItems((prev) => updateCartItemQuantity(prev, productId, quantity, variantId));
  };

  // Clear entire cart using cart service
  const clearCart = () => {
    setItems(clearCartItems());
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isHydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Hook for accessing cart context
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
