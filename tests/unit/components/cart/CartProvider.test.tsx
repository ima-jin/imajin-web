import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from '@/components/cart/CartProvider';
import type { CartItem } from '@/types/cart';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('CartProvider', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  const mockItem: Omit<CartItem, 'quantity'> = {
    productId: 'test-product-1',
    name: 'Test Product',
    price: 5000,
    image: '/test-image.jpg',
  };

  it('provides initial empty cart state', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.itemCount).toBe(0);
    expect(result.current.subtotal).toBe(0);
  });

  it('adds item to cart', async () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await act(async () => {
      await result.current.addItem(mockItem);
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0]).toMatchObject({
        ...mockItem,
        quantity: 1,
      });
      expect(result.current.itemCount).toBe(1);
    });
  });

  it('adds item with custom quantity', async () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await act(async () => {
      await result.current.addItem({ ...mockItem, quantity: 3 });
    });

    await waitFor(() => {
      expect(result.current.items[0].quantity).toBe(3);
      expect(result.current.itemCount).toBe(3);
    });
  });

  it('updates existing item quantity when adding duplicate', async () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await act(async () => {
      await result.current.addItem({ ...mockItem, quantity: 2 });
    });

    await act(async () => {
      await result.current.addItem({ ...mockItem, quantity: 3 });
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(5);
      expect(result.current.itemCount).toBe(5);
    });
  });

  it('treats items with different variants as separate', async () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await act(async () => {
      await result.current.addItem({ ...mockItem, variantId: 'variant-1' });
    });

    await act(async () => {
      await result.current.addItem({ ...mockItem, variantId: 'variant-2' });
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(2);
      expect(result.current.itemCount).toBe(2);
    });
  });

  it('removes item from cart', async () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await act(async () => {
      await result.current.addItem(mockItem);
    });

    act(() => {
      result.current.removeItem('test-product-1');
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(0);
      expect(result.current.itemCount).toBe(0);
    });
  });

  it('removes correct variant from cart', async () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await act(async () => {
      await result.current.addItem({ ...mockItem, variantId: 'variant-1' });
      await result.current.addItem({ ...mockItem, variantId: 'variant-2' });
    });

    act(() => {
      result.current.removeItem('test-product-1', 'variant-1');
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].variantId).toBe('variant-2');
    });
  });

  it('updates item quantity', async () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await act(async () => {
      await result.current.addItem({ ...mockItem, quantity: 2 });
    });

    act(() => {
      result.current.updateQuantity('test-product-1', undefined, 5);
    });

    await waitFor(() => {
      expect(result.current.items[0].quantity).toBe(5);
      expect(result.current.itemCount).toBe(5);
    });
  });

  it('removes item when quantity updated to 0', async () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await act(async () => {
      await result.current.addItem(mockItem);
    });

    act(() => {
      result.current.updateQuantity('test-product-1', undefined, 0);
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(0);
    });
  });

  it('removes item when quantity updated to negative', async () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await act(async () => {
      await result.current.addItem(mockItem);
    });

    act(() => {
      result.current.updateQuantity('test-product-1', undefined, -1);
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(0);
    });
  });

  it('clears entire cart', async () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await act(async () => {
      await result.current.addItem(mockItem);
      await result.current.addItem({ ...mockItem, productId: 'test-product-2' });
    });

    act(() => {
      result.current.clearCart();
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(0);
      expect(result.current.itemCount).toBe(0);
      expect(result.current.subtotal).toBe(0);
    });
  });

  it('calculates subtotal correctly', async () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await act(async () => {
      await result.current.addItem({ ...mockItem, price: 5000, quantity: 2 });
      await result.current.addItem({
        ...mockItem,
        productId: 'test-product-2',
        price: 3000,
        quantity: 3,
      });
    });

    await waitFor(() => {
      // (5000 * 2) + (3000 * 3) = 10000 + 9000 = 19000
      expect(result.current.subtotal).toBe(19000);
    });
  });

  it('persists items to localStorage when cart changes', async () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await act(async () => {
      await result.current.addItem(mockItem);
    });

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'imajin_cart',
        expect.stringContaining('test-product-1')
      );
    });
  });

  it('loads items from localStorage on mount', async () => {
    const storedItems: CartItem[] = [
      { ...mockItem, quantity: 2 },
    ];
    localStorageMock.setItem('imajin_cart', JSON.stringify(storedItems));

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(2);
    });
  });

  it('handles invalid localStorage data gracefully', async () => {
    localStorageMock.setItem('imajin_cart', 'invalid json');

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
      expect(result.current.items).toEqual([]);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('imajin_cart');
    });
  });

  it('handles non-array localStorage data gracefully', async () => {
    localStorageMock.setItem('imajin_cart', JSON.stringify({ foo: 'bar' }));

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
      expect(result.current.items).toEqual([]);
    });
  });

  it('sets isHydrated to true after mount', async () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    // After hydration completes, isHydrated should be true
    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });
  });

  it('throws error when useCart used outside CartProvider', () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useCart());
    }).toThrow('useCart must be used within CartProvider');

    consoleError.mockRestore();
  });
});
