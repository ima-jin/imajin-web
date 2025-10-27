import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CartSummary } from '@/components/cart/CartSummary';
import { mockUIStrings } from '@/tests/helpers/mock-content';

// Mock useCart hook
const mockUseCart = vi.fn();
vi.mock('@/components/cart/CartProvider', async () => {
  const actual = await vi.importActual('@/components/cart/CartProvider');
  return {
    ...actual,
    useCart: () => mockUseCart(),
  };
});

describe('CartSummary', () => {
  it('displays subtotal with zero items', () => {
    mockUseCart.mockReturnValue({
      subtotal: 0,
      itemCount: 0,
    });

    render(<CartSummary uiStrings={mockUIStrings} />);

    expect(screen.getByText(/subtotal/i)).toBeInTheDocument();
    expect(screen.getByText(/0.*items/i)).toBeInTheDocument();
    const prices = screen.getAllByText('$0.00');
    expect(prices.length).toBeGreaterThanOrEqual(1);
  });

  it('displays subtotal with one item', () => {
    mockUseCart.mockReturnValue({
      subtotal: 5000,
      itemCount: 1,
    });

    render(<CartSummary uiStrings={mockUIStrings} />);

    expect(screen.getByText(/1.*item\b/i)).toBeInTheDocument();
    const prices = screen.getAllByText('$50.00');
    expect(prices.length).toBeGreaterThanOrEqual(1);
  });

  it('displays subtotal with multiple items', () => {
    mockUseCart.mockReturnValue({
      subtotal: 15000,
      itemCount: 3,
    });

    render(<CartSummary uiStrings={mockUIStrings} />);

    expect(screen.getByText(/3.*items/i)).toBeInTheDocument();
    const prices = screen.getAllByText('$150.00');
    expect(prices.length).toBeGreaterThanOrEqual(1);
  });

  it('displays shipping message', () => {
    mockUseCart.mockReturnValue({
      subtotal: 5000,
      itemCount: 1,
    });

    render(<CartSummary uiStrings={mockUIStrings} />);

    expect(screen.getByText(/shipping/i)).toBeInTheDocument();
    expect(screen.getByText(/calculated at checkout/i)).toBeInTheDocument();
  });

  it('displays total (same as subtotal for now)', () => {
    mockUseCart.mockReturnValue({
      subtotal: 25000,
      itemCount: 2,
    });

    render(<CartSummary uiStrings={mockUIStrings} />);

    expect(screen.getByText(/^total$/i)).toBeInTheDocument();
    // Should show subtotal as total since shipping/tax not yet calculated
    const totals = screen.getAllByText('$250.00');
    expect(totals.length).toBeGreaterThanOrEqual(1);
  });

  it('formats large amounts correctly', () => {
    mockUseCart.mockReturnValue({
      subtotal: 123456,
      itemCount: 5,
    });

    render(<CartSummary uiStrings={mockUIStrings} />);

    const amounts = screen.getAllByText('$1,234.56');
    expect(amounts.length).toBeGreaterThanOrEqual(1);
  });
});
