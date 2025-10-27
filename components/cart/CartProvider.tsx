'use client';

import { createContext, useContext, useState, useEffect, useLayoutEffect, ReactNode } from 'react';
import type { CartItem } from '@/types/cart';

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

  // Calculate totals
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Add item to cart
  const addItem = async (newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const quantity = newItem.quantity || 1;

    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.productId === newItem.productId &&
          item.variantId === newItem.variantId
      );

      if (existingIndex !== -1) {
        // Update existing item quantity
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      } else {
        // Add new item
        return [...prev, { ...newItem, quantity } as CartItem];
      }
    });
  };

  // Remove item from cart
  const removeItem = (productId: string, variantId?: string) => {
    setItems((prev) =>
      prev.filter(
        (item) => !(item.productId === productId && item.variantId === variantId)
      )
    );
  };

  // Update item quantity
  const updateQuantity = (productId: string, variantId: string | undefined, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity }
          : item
      )
    );
  };

  // Clear entire cart
  const clearCart = () => {
    setItems([]);
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
