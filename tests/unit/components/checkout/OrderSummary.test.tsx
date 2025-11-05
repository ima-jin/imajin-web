import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import type { CartItem } from '@/types/cart';

describe('OrderSummary', () => {
  const mockItems: CartItem[] = [
    {
      productId: 'product-1',
      name: 'Test Product 1',
      price: 5000,
      stripePriceId: 'price_test_1',
      image: 'https://res.cloudinary.com/test/image/upload/test-image-1.jpg',
      quantity: 2,
    },
    {
      productId: 'product-2',
      variantId: 'variant-1',
      name: 'Test Product 2',
      price: 7500,
      stripePriceId: 'price_test_2',
      image: 'https://res.cloudinary.com/test/image/upload/test-image-2.jpg',
      quantity: 1,
      variantName: 'RED',
    },
  ];

  it('displays order summary heading', () => {
    render(<OrderSummary items={mockItems} />);
    expect(screen.getByText('Order Summary')).toBeInTheDocument();
  });

  it('displays all cart items', () => {
    render(<OrderSummary items={mockItems} />);
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();
  });

  it('displays product images with correct src', () => {
    render(<OrderSummary items={mockItems} />);

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);

    expect(images[0]).toHaveAttribute('src', expect.stringContaining('test-image-1.jpg'));
    expect(images[1]).toHaveAttribute('src', expect.stringContaining('test-image-2.jpg'));
  });

  it('displays product images with correct alt text', () => {
    render(<OrderSummary items={mockItems} />);

    expect(screen.getByAltText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByAltText('Test Product 2')).toBeInTheDocument();
  });

  it('displays variant name when present', () => {
    render(<OrderSummary items={mockItems} />);
    expect(screen.getByText('RED')).toBeInTheDocument();
  });

  it('displays quantities', () => {
    render(<OrderSummary items={mockItems} />);
    expect(screen.getByText('Qty: 2')).toBeInTheDocument();
    expect(screen.getByText('Qty: 1')).toBeInTheDocument();
  });

  it('displays item prices', () => {
    render(<OrderSummary items={mockItems} />);
    expect(screen.getByText('$100.00')).toBeInTheDocument(); // 2 x $50.00
    expect(screen.getByText('$75.00')).toBeInTheDocument(); // 1 x $75.00
  });

  it('calculates and displays subtotal correctly', () => {
    render(<OrderSummary items={mockItems} />);
    // Subtotal: (2 * 5000) + (1 * 7500) = 17500 cents = $175.00
    const amounts = screen.getAllByText('$175.00');
    expect(amounts.length).toBeGreaterThanOrEqual(1);
  });

  it('displays item count', () => {
    render(<OrderSummary items={mockItems} />);
    expect(screen.getByText(/3.*items/i)).toBeInTheDocument();
  });

  it('displays shipping and tax placeholders', () => {
    render(<OrderSummary items={mockItems} />);
    expect(screen.getByText('Shipping')).toBeInTheDocument();
    expect(screen.getByText('Tax')).toBeInTheDocument();
    const calculatedTexts = screen.getAllByText('Calculated at checkout');
    expect(calculatedTexts).toHaveLength(2);
  });

  it('displays total heading', () => {
    render(<OrderSummary items={mockItems} />);
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('displays Stripe notice', () => {
    render(<OrderSummary items={mockItems} />);
    expect(screen.getByText(/Final total including shipping and tax will be calculated by Stripe/i)).toBeInTheDocument();
  });

  it('handles single item correctly', () => {
    const singleItem: CartItem[] = [{
      productId: 'product-1',
      name: 'Single Product',
      price: 10000,
      stripePriceId: 'price_test',
      image: 'https://res.cloudinary.com/test/image/upload/single.jpg',
      quantity: 1,
    }];

    render(<OrderSummary items={singleItem} />);
    expect(screen.getByText(/1.*item\b/i)).toBeInTheDocument();
  });

  it('handles empty cart gracefully', () => {
    render(<OrderSummary items={[]} />);
    expect(screen.getByText('Order Summary')).toBeInTheDocument();
    expect(screen.getByText(/0.*items/i)).toBeInTheDocument();
    const zeroAmounts = screen.getAllByText('$0.00');
    expect(zeroAmounts.length).toBeGreaterThanOrEqual(1);
  });
});
