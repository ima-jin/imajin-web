import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import type { CartItem } from '@/types/cart';

// Mock useCart hook
const mockAddItem = vi.fn();
vi.mock('@/components/cart/CartProvider', () => ({
  useCart: () => ({
    addItem: mockAddItem,
  }),
}));

describe('AddToCartButton', () => {
  const baseProduct: Omit<CartItem, 'quantity'> = {
    productId: 'test-product',
    name: 'Test Product',
    price: 5000,
    image: '/test.jpg',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders add to cart button', () => {
    render(<AddToCartButton product={baseProduct} />);

    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
  });

  it('calls addItem when clicked', () => {
    render(<AddToCartButton product={baseProduct} />);

    const button = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(button);

    expect(mockAddItem).toHaveBeenCalledWith({ ...baseProduct, quantity: 1 });
  });

  it('adds specified quantity', () => {
    render(<AddToCartButton product={baseProduct} quantity={3} />);

    const button = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(button);

    expect(mockAddItem).toHaveBeenCalledWith({ ...baseProduct, quantity: 3 });
  });

  it('handles variant products', () => {
    const variantProduct: Omit<CartItem, 'quantity'> = {
      ...baseProduct,
      variantId: 'variant-black',
      name: 'Test Product - BLACK',
    };

    render(<AddToCartButton product={variantProduct} />);

    const button = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(button);

    expect(mockAddItem).toHaveBeenCalledWith({ ...variantProduct, quantity: 1 });
  });

  it('shows loading state while adding', async () => {
    // Mock a delayed addItem
    mockAddItem.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<AddToCartButton product={baseProduct} />);

    const button = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(button);

    // Should show loading text or be disabled
    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });

  it('shows success feedback after adding', async () => {
    mockAddItem.mockResolvedValue(undefined);

    render(<AddToCartButton product={baseProduct} />);

    const button = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(button);

    // Should show success state
    await waitFor(() => {
      expect(screen.getByText(/added/i)).toBeInTheDocument();
    });
  });

  it('can be customized with className', () => {
    render(<AddToCartButton product={baseProduct} className="custom-class" />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('supports different button sizes', () => {
    const { rerender } = render(<AddToCartButton product={baseProduct} size="sm" />);

    let button = screen.getByRole('button');
    expect(button.className).toContain('sm');

    rerender(<AddToCartButton product={baseProduct} size="lg" />);

    button = screen.getByRole('button');
    expect(button.className).toContain('lg');
  });

  it('prevents multiple simultaneous clicks', async () => {
    mockAddItem.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<AddToCartButton product={baseProduct} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    // Should only call addItem once
    expect(mockAddItem).toHaveBeenCalledTimes(1);
  });

  it('displays custom button text when provided', () => {
    render(<AddToCartButton product={baseProduct} buttonText="Buy Now" />);

    expect(screen.getByRole('button', { name: /buy now/i })).toBeInTheDocument();
  });
});
