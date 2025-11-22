/**
 * Tests for ProductAddToCart component
 *
 * Verifies conditional rendering based on product sell status:
 * - pre-sale: Shows DepositButton
 * - pre-order: Shows AddToCartButton with "Pre-Order" text
 * - for-sale: Shows AddToCartButton with "Add to Cart" text
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProductAddToCart } from '@/components/products/ProductAddToCart';

// Mock dependencies
vi.mock('@/components/cart/AddToCartButton', () => ({
  AddToCartButton: ({ buttonText }: { buttonText: string }) => (
    <button data-testid="add-to-cart-button">{buttonText}</button>
  ),
}));

vi.mock('@/components/products/DepositButton', () => ({
  DepositButton: ({ productName, depositAmount }: { productName: string; depositAmount: number }) => (
    <button data-testid="deposit-button">
      Pay Deposit - {productName} - ${depositAmount / 100}
    </button>
  ),
}));

vi.mock('@/components/toast/ToastProvider', () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

describe('ProductAddToCart', () => {
  const baseProduct = {
    id: 'test-product',
    name: 'Test Product',
    basePriceCents: 100000, // $1000 in cents
    image: '/test.jpg',
  };

  describe('Pre-sale products', () => {
    it('should render DepositButton when sellStatus is pre-sale', () => {
      const product = {
        ...baseProduct,
        sellStatus: 'pre-sale',
        presaleDepositPrice: 25000, // $250 deposit
      };

      render(<ProductAddToCart product={product} />);

      expect(screen.getByTestId('deposit-button')).toBeInTheDocument();
      expect(screen.queryByTestId('add-to-cart-button')).not.toBeInTheDocument();
    });

    it('should pass correct depositAmount to DepositButton', () => {
      const product = {
        ...baseProduct,
        sellStatus: 'pre-sale',
        presaleDepositPrice: 25000,
      };

      render(<ProductAddToCart product={product} />);

      const depositButton = screen.getByTestId('deposit-button');
      expect(depositButton).toHaveTextContent('$250');
    });

    it('should pass productName to DepositButton', () => {
      const product = {
        ...baseProduct,
        name: 'Founder Edition',
        sellStatus: 'pre-sale',
        presaleDepositPrice: 25000,
      };

      render(<ProductAddToCart product={product} />);

      const depositButton = screen.getByTestId('deposit-button');
      expect(depositButton).toHaveTextContent('Founder Edition');
    });

    it('should show DepositButton even when variants exist', () => {
      const product = {
        ...baseProduct,
        sellStatus: 'pre-sale',
        presaleDepositPrice: 25000,
        variants: [
          {
            id: 'var-1',
            stripePriceId: 'price_123',
            variantValue: 'BLACK',
            priceModifier: 0,
            availableQuantity: 500,
            isAvailable: true,
          },
        ],
      };

      render(<ProductAddToCart product={product} />);

      expect(screen.getByTestId('deposit-button')).toBeInTheDocument();
      expect(screen.queryByTestId('add-to-cart-button')).not.toBeInTheDocument();
    });
  });

  describe('Pre-order products', () => {
    it('should render AddToCartButton with "Pre-Order" text', () => {
      const product = {
        ...baseProduct,
        sellStatus: 'pre-order',
      };

      render(<ProductAddToCart product={product} />);

      const button = screen.getByTestId('add-to-cart-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Pre-Order');
      expect(screen.queryByTestId('deposit-button')).not.toBeInTheDocument();
    });
  });

  describe('For-sale products', () => {
    it('should render AddToCartButton with "Add to Cart" text', () => {
      const product = {
        ...baseProduct,
        sellStatus: 'for-sale',
      };

      render(<ProductAddToCart product={product} />);

      const button = screen.getByTestId('add-to-cart-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Add to Cart');
      expect(screen.queryByTestId('deposit-button')).not.toBeInTheDocument();
    });

    it('should render AddToCartButton when sellStatus is undefined', () => {
      const product = {
        ...baseProduct,
        // No sellStatus
      };

      render(<ProductAddToCart product={product} />);

      const button = screen.getByTestId('add-to-cart-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Add to Cart');
    });
  });

  describe('Sold out variants', () => {
    it('should show "Sold Out" button when selected variant is not available', () => {
      const product = {
        ...baseProduct,
        sellStatus: 'for-sale',
        variants: [
          {
            id: 'var-1',
            stripePriceId: 'price_123',
            variantValue: 'BLACK',
            priceModifier: 0,
            availableQuantity: 0,
            isAvailable: false,
          },
        ],
      };

      render(<ProductAddToCart product={product} />);

      expect(screen.getByText('Sold Out')).toBeInTheDocument();
      expect(screen.queryByTestId('add-to-cart-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('deposit-button')).not.toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle missing presaleDepositPrice gracefully', () => {
      const product = {
        ...baseProduct,
        sellStatus: 'pre-sale',
        // No presaleDepositPrice defined
      };

      render(<ProductAddToCart product={product} />);

      // Should still render DepositButton with 0 or fallback
      expect(screen.getByTestId('deposit-button')).toBeInTheDocument();
    });

    it('should prioritize DepositButton over Sold Out for pre-sale products', () => {
      const product = {
        ...baseProduct,
        sellStatus: 'pre-sale',
        presaleDepositPrice: 25000,
        variants: [
          {
            id: 'var-1',
            stripePriceId: 'price_123',
            variantValue: 'BLACK',
            priceModifier: 0,
            availableQuantity: 0,
            isAvailable: false, // Sold out
          },
        ],
      };

      render(<ProductAddToCart product={product} />);

      // Pre-sale deposits can still be taken even if variants are sold out
      expect(screen.getByTestId('deposit-button')).toBeInTheDocument();
      expect(screen.queryByText('Sold Out')).not.toBeInTheDocument();
    });
  });
});
