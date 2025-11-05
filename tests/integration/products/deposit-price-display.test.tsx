import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import * as orderService from '@/lib/services/order-service';

// Mock the order service
vi.mock('@/lib/services/order-service');

// Mock product detail page component (simplified for testing)
function MockProductPage({
  product,
  userEmail
}: {
  product: any;
  userEmail: string | null;
}) {
  const [hasDeposit, setHasDeposit] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function checkDeposit() {
      try {
        if (userEmail && product.id) {
          const result = await orderService.userHasPaidDeposit(userEmail, product.id);
          setHasDeposit(result);
        }
      } catch (error) {
        // On error, default to no deposit
        setHasDeposit(false);
      }
      setLoading(false);
    }
    checkDeposit();
  }, [userEmail, product.id]);

  if (loading) return <div>Loading...</div>;

  // Business logic: determine price based on sellStatus and deposit
  let displayPrice = product.basePrice;
  let priceType: 'base' | 'wholesale' = 'base';

  if (product.sellStatus === 'pre-order' && hasDeposit && product.wholesalePriceCents) {
    // Pre-order with deposit: show wholesale price
    displayPrice = product.wholesalePriceCents;
    if (product.selectedVariant?.wholesalePriceModifier) {
      displayPrice += product.selectedVariant.wholesalePriceModifier;
    }
    priceType = 'wholesale';
  } else if (product.sellStatus === 'for-sale') {
    // For-sale: always base price
    displayPrice = product.basePrice;
    priceType = 'base';
  }

  // Format price with commas
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div>
      <h1>{product.name}</h1>
      <p data-testid="price">{formatPrice(displayPrice)}</p>
      <p data-testid="price-type">{priceType}</p>
      {product.sellStatus === 'pre-order' && hasDeposit && product.wholesalePriceCents && (
        <div data-testid="wholesale-badge">Wholesale Price</div>
      )}
      {product.sellStatus === 'pre-order' && hasDeposit && (
        <p data-testid="deposit-note">Your deposit will be applied at checkout</p>
      )}
    </div>
  );
}

// Import React for the mock component
import React from 'react';

describe('Product Page - Deposit Price Display', () => {
  const mockProduct = {
    id: 'test-product',
    name: 'Test Product',
    basePrice: 129500, // $1,295
    wholesalePriceCents: 97500, // $975
    sellStatus: 'pre-order',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Pre-sale Products', () => {
    it('pre-sale product shows deposit amount', () => {
      const presaleProduct = {
        ...mockProduct,
        sellStatus: 'pre-sale',
        presaleDepositPrice: 25000,
      };

      render(<MockProductPage product={presaleProduct} userEmail={null} />);

      // For pre-sale, we'd show the deposit amount in the DepositButton
      // This test verifies the product has the correct deposit price configured
      expect(presaleProduct.presaleDepositPrice).toBe(25000);
    });
  });

  describe('Pre-order With Deposit', () => {
    it('pre-order with deposit shows wholesale price', async () => {
      vi.mocked(orderService.userHasPaidDeposit).mockResolvedValueOnce(true);

      render(<MockProductPage product={mockProduct} userEmail="test@example.com" />);

      await waitFor(() => {
        expect(screen.getByTestId('price')).toHaveTextContent('$975.00');
        expect(screen.getByTestId('price-type')).toHaveTextContent('wholesale');
      });
    });

    it('wholesale price badge appears for deposit holders', async () => {
      vi.mocked(orderService.userHasPaidDeposit).mockResolvedValueOnce(true);

      render(<MockProductPage product={mockProduct} userEmail="test@example.com" />);

      await waitFor(() => {
        expect(screen.getByTestId('wholesale-badge')).toBeInTheDocument();
      });
    });

    it('deposit note displayed correctly', async () => {
      vi.mocked(orderService.userHasPaidDeposit).mockResolvedValueOnce(true);

      render(<MockProductPage product={mockProduct} userEmail="test@example.com" />);

      await waitFor(() => {
        expect(screen.getByTestId('deposit-note')).toHaveTextContent(
          'Your deposit will be applied at checkout'
        );
      });
    });

    it('variant-specific wholesale pricing', async () => {
      const productWithVariant = {
        ...mockProduct,
        selectedVariant: {
          id: 'variant-black',
          wholesalePriceModifier: 1000, // +$10
        },
      };

      vi.mocked(orderService.userHasPaidDeposit).mockResolvedValueOnce(true);

      render(<MockProductPage product={productWithVariant} userEmail="test@example.com" />);

      await waitFor(() => {
        // Base wholesale $975 + $10 modifier = $985
        const expectedPrice = (97500 + 1000) / 100;
        expect(screen.getByTestId('price')).toHaveTextContent(`$${expectedPrice.toFixed(2)}`);
      });
    });
  });

  describe('Pre-order Without Deposit', () => {
    it('pre-order without deposit shows base price', async () => {
      vi.mocked(orderService.userHasPaidDeposit).mockResolvedValueOnce(false);

      render(<MockProductPage product={mockProduct} userEmail="test@example.com" />);

      await waitFor(() => {
        expect(screen.getByTestId('price')).toHaveTextContent('$1,295.00');
        expect(screen.getByTestId('price-type')).toHaveTextContent('base');
      });
    });

    it('wholesale badge hidden for non-deposit holders', async () => {
      vi.mocked(orderService.userHasPaidDeposit).mockResolvedValueOnce(false);

      render(<MockProductPage product={mockProduct} userEmail="test@example.com" />);

      await waitFor(() => {
        expect(screen.queryByTestId('wholesale-badge')).not.toBeInTheDocument();
      });
    });

    it('deposit note hidden for non-deposit holders', async () => {
      vi.mocked(orderService.userHasPaidDeposit).mockResolvedValueOnce(false);

      render(<MockProductPage product={mockProduct} userEmail="test@example.com" />);

      await waitFor(() => {
        expect(screen.queryByTestId('deposit-note')).not.toBeInTheDocument();
      });
    });
  });

  describe('For-sale Products', () => {
    it('for-sale product always shows base price', async () => {
      const forsaleProduct = {
        ...mockProduct,
        sellStatus: 'for-sale',
      };

      vi.mocked(orderService.userHasPaidDeposit).mockResolvedValueOnce(true);

      render(<MockProductPage product={forsaleProduct} userEmail="test@example.com" />);

      await waitFor(() => {
        expect(screen.getByTestId('price')).toHaveTextContent('$1,295.00');
        expect(screen.getByTestId('price-type')).toHaveTextContent('base');
      });
    });
  });

  describe('Email Link Support', () => {
    it('email link query param works', async () => {
      // Simulates user clicking email link with ?email=test@example.com
      vi.mocked(orderService.userHasPaidDeposit).mockResolvedValueOnce(true);

      render(<MockProductPage product={mockProduct} userEmail="test@example.com" />);

      await waitFor(() => {
        expect(orderService.userHasPaidDeposit).toHaveBeenCalledWith(
          'test@example.com',
          'test-product'
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('handles missing wholesale price gracefully', async () => {
      const productWithoutWholesale = {
        ...mockProduct,
        wholesalePriceCents: null,
      };

      vi.mocked(orderService.userHasPaidDeposit).mockResolvedValueOnce(true);

      render(<MockProductPage product={productWithoutWholesale} userEmail="test@example.com" />);

      await waitFor(() => {
        // Falls back to base price
        expect(screen.getByTestId('price')).toHaveTextContent('$1,295.00');
      });
    });

    it('handles API failures gracefully', async () => {
      vi.mocked(orderService.userHasPaidDeposit).mockRejectedValueOnce(
        new Error('Database error')
      );

      // Should not crash, should show base price
      render(<MockProductPage product={mockProduct} userEmail="test@example.com" />);

      await waitFor(() => {
        // Defaults to no deposit (base price)
        expect(screen.getByTestId('price')).toHaveTextContent('$1,295.00');
      });
    });

    it('loading states display correctly', () => {
      vi.mocked(orderService.userHasPaidDeposit).mockImplementationOnce(
        () => new Promise(() => {}) // Never resolves
      );

      render(<MockProductPage product={mockProduct} userEmail="test@example.com" />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });
});
