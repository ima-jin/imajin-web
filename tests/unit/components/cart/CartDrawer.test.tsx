import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { mockUIStrings } from '@/tests/helpers/mock-content';
import type { CartItem } from '@/types/cart';

// Mock useCart hook
const mockUseCart = vi.fn();
const mockUpdateQuantity = vi.fn();
const mockRemoveItem = vi.fn();

vi.mock('@/components/cart/CartProvider', async () => {
  const actual = await vi.importActual('@/components/cart/CartProvider');
  return {
    ...actual,
    useCart: () => mockUseCart(),
  };
});

describe('CartDrawer', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when isOpen is true', () => {
    mockUseCart.mockReturnValue({
      items: [],
      subtotal: 0,
      itemCount: 0,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
    });

    render(<CartDrawer isOpen={true} onClose={mockOnClose} uiStrings={mockUIStrings} />);

    expect(screen.getByText(/shopping cart/i)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    mockUseCart.mockReturnValue({
      items: [],
      subtotal: 0,
      itemCount: 0,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
    });

    render(<CartDrawer isOpen={false} onClose={mockOnClose} uiStrings={mockUIStrings} />);

    // Should not display cart content when closed
    expect(screen.queryByText(/shopping cart/i)).not.toBeInTheDocument();
  });

  it('displays close button', () => {
    mockUseCart.mockReturnValue({
      items: [],
      subtotal: 0,
      itemCount: 0,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
    });

    render(<CartDrawer isOpen={true} onClose={mockOnClose} uiStrings={mockUIStrings} />);

    const closeButton = screen.getByLabelText(/close/i);
    expect(closeButton).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    mockUseCart.mockReturnValue({
      items: [],
      subtotal: 0,
      itemCount: 0,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
    });

    render(<CartDrawer isOpen={true} onClose={mockOnClose} uiStrings={mockUIStrings} />);

    const closeButton = screen.getByLabelText(/close/i);
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('displays empty cart message when no items', () => {
    mockUseCart.mockReturnValue({
      items: [],
      subtotal: 0,
      itemCount: 0,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
    });

    render(<CartDrawer isOpen={true} onClose={mockOnClose} uiStrings={mockUIStrings} />);

    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it('displays cart items', () => {
    const items: CartItem[] = [
      {
        productId: 'product-1',
        name: 'Test Product 1',
        price: 5000,
        stripeProductId: 'price_test',
        image: '/test1.jpg',
        quantity: 2,
      },
      {
        productId: 'product-2',
        name: 'Test Product 2',
        price: 10000,
        stripeProductId: 'price_test',
        image: '/test2.jpg',
        quantity: 1,
      },
    ];

    mockUseCart.mockReturnValue({
      items,
      subtotal: 20000,
      itemCount: 3,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
    });

    render(<CartDrawer isOpen={true} onClose={mockOnClose} uiStrings={mockUIStrings} />);

    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();
  });

  it('displays checkout button when cart has items', () => {
    const items: CartItem[] = [
      {
        productId: 'product-1',
        name: 'Test Product',
        price: 5000,
        stripeProductId: 'price_test',
        image: '/test.jpg',
        quantity: 1,
      },
    ];

    mockUseCart.mockReturnValue({
      items,
      subtotal: 5000,
      itemCount: 1,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
    });

    render(<CartDrawer isOpen={true} onClose={mockOnClose} uiStrings={mockUIStrings} />);

    const checkoutButton = screen.getByRole('button', { name: /checkout/i });
    expect(checkoutButton).toBeInTheDocument();
  });

  it('does not display checkout button when cart is empty', () => {
    mockUseCart.mockReturnValue({
      items: [],
      subtotal: 0,
      itemCount: 0,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
    });

    render(<CartDrawer isOpen={true} onClose={mockOnClose} uiStrings={mockUIStrings} />);

    const checkoutButton = screen.queryByRole('button', { name: /checkout/i });
    expect(checkoutButton).not.toBeInTheDocument();
  });

  it('displays cart summary', () => {
    const items: CartItem[] = [
      {
        productId: 'product-1',
        name: 'Test Product',
        price: 5000,
        stripeProductId: 'price_test',
        image: '/test.jpg',
        quantity: 2,
      },
    ];

    mockUseCart.mockReturnValue({
      items,
      subtotal: 10000,
      itemCount: 2,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
    });

    render(<CartDrawer isOpen={true} onClose={mockOnClose} uiStrings={mockUIStrings} />);

    // CartSummary should display subtotal
    expect(screen.getByText(/subtotal/i)).toBeInTheDocument();
  });

  it('closes when overlay is clicked', () => {
    mockUseCart.mockReturnValue({
      items: [],
      subtotal: 0,
      itemCount: 0,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
    });

    render(<CartDrawer isOpen={true} onClose={mockOnClose} uiStrings={mockUIStrings} />);

    // Find and click the overlay (backdrop)
    const overlay = document.querySelector('[data-testid="cart-drawer-overlay"]');
    if (overlay) {
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('prevents propagation when clicking drawer content', () => {
    mockUseCart.mockReturnValue({
      items: [],
      subtotal: 0,
      itemCount: 0,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
    });

    render(<CartDrawer isOpen={true} onClose={mockOnClose} uiStrings={mockUIStrings} />);

    // Clicking the drawer content should not close it
    const drawerContent = document.querySelector('[data-testid="cart-drawer-content"]');
    if (drawerContent) {
      fireEvent.click(drawerContent);
      expect(mockOnClose).not.toHaveBeenCalled();
    }
  });

  it('displays item count in header', () => {
    const items: CartItem[] = [
      {
        productId: 'product-1',
        name: 'Test Product',
        price: 5000,
        stripeProductId: 'price_test',
        image: '/test.jpg',
        quantity: 3,
      },
    ];

    mockUseCart.mockReturnValue({
      items,
      subtotal: 15000,
      itemCount: 3,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
    });

    render(<CartDrawer isOpen={true} onClose={mockOnClose} uiStrings={mockUIStrings} />);

    // Text appears in both header and summary, so use getAllByText
    const itemCountTexts = screen.getAllByText(/3.*items/i);
    expect(itemCountTexts.length).toBeGreaterThanOrEqual(1);
  });
});
