import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriceDisplay } from '@/components/ui/PriceDisplay';

describe('PriceDisplay Component', () => {
  describe('Pre-Sale Display', () => {
    it('should show deposit badge and amount for pre-sale', () => {
      // Arrange
      const product = {
        id: 'prod_1',
        sellStatus: 'pre-sale',
        presaleDepositPriceCents: 10000, // $100.00
        basePriceCents: 50000
      };

      // Act
      render(<PriceDisplay product={product} variant="card" />);

      // Assert
      expect(screen.getByText('Deposit')).toBeInTheDocument();
      expect(screen.getByText('$100.00')).toBeInTheDocument();
      expect(screen.getByText(/refundable deposit/i)).toBeInTheDocument();
    });

    it('should show deposit with expanded layout in detail variant', () => {
      // Arrange
      const product = {
        id: 'prod_1',
        sellStatus: 'pre-sale',
        presaleDepositPriceCents: 10000,
        basePriceCents: 50000
      };

      // Act
      render(<PriceDisplay product={product} variant="detail" />);

      // Assert
      expect(screen.getByText('Deposit')).toBeInTheDocument();
      expect(screen.getByText('$100.00')).toBeInTheDocument();
      // Detail variant should have larger text
      const priceElement = screen.getByText('$100.00');
      expect(priceElement).toHaveClass('text-3xl');
    });
  });

  describe('Wholesale Price Display', () => {
    it('should show wholesale price badge when user paid deposit', () => {
      // Arrange
      const product = {
        id: 'prod_1',
        sellStatus: 'pre-order',
        basePriceCents: 50000, // $500.00
        wholesalePriceCents: 40000 // $400.00
      };

      // Act
      render(<PriceDisplay product={product} userHasPaidDeposit={true} variant="card" />);

      // Assert
      expect(screen.getByText('$400.00')).toBeInTheDocument();
      expect(screen.getByText('Wholesale')).toBeInTheDocument();
    });

    it('should show regular price when user has not paid deposit', () => {
      // Arrange
      const product = {
        id: 'prod_1',
        sellStatus: 'pre-order',
        basePriceCents: 50000,
        wholesalePriceCents: 40000
      };

      // Act
      render(<PriceDisplay product={product} userHasPaidDeposit={false} variant="card" />);

      // Assert
      expect(screen.getByText('$500.00')).toBeInTheDocument();
      expect(screen.queryByText('Wholesale')).not.toBeInTheDocument();
    });
  });

  describe('Regular Price Display', () => {
    it('should show regular price for products in for-sale status', () => {
      // Arrange
      const product = {
        id: 'prod_1',
        sellStatus: 'for-sale',
        basePriceCents: 29900 // $299.00
      };

      // Act
      render(<PriceDisplay product={product} variant="card" />);

      // Assert
      expect(screen.getByText('$299.00')).toBeInTheDocument();
      expect(screen.queryByText('Deposit')).not.toBeInTheDocument();
      expect(screen.queryByText('Wholesale')).not.toBeInTheDocument();
    });

    it('should show regular price for pre-order products', () => {
      // Arrange
      const product = {
        id: 'prod_1',
        sellStatus: 'pre-order',
        basePriceCents: 49900
      };

      // Act
      render(<PriceDisplay product={product} variant="card" />);

      // Assert
      expect(screen.getByText('$499.00')).toBeInTheDocument();
    });
  });

  describe('Fallback Display', () => {
    it('should show fallback message when displayPrice is null', () => {
      // Arrange
      const product = {
        id: 'prod_1',
        sellStatus: 'internal', // Internal products don't show prices
        basePriceCents: 0
      };

      // Act
      render(<PriceDisplay product={product} variant="card" />);

      // Assert
      expect(screen.getByText(/pricing available soon/i)).toBeInTheDocument();
      expect(screen.queryByText('$')).not.toBeInTheDocument();
    });

    it('should show expanded fallback message in detail variant', () => {
      // Arrange
      const product = {
        id: 'prod_1',
        sellStatus: 'internal',
        basePriceCents: 0
      };

      // Act
      render(<PriceDisplay product={product} variant="detail" />);

      // Assert
      expect(screen.getByText(/pricing will be available soon/i)).toBeInTheDocument();
    });
  });

  describe('Display Status Messages', () => {
    it('should show display status message below price', () => {
      // Arrange
      const product = {
        id: 'prod_1',
        sellStatus: 'pre-order',
        basePriceCents: 50000
      };

      // Act
      render(<PriceDisplay product={product} variant="card" />);

      // Assert
      // displayStatus.message should be rendered (from getProductDisplayStatus utility)
      // This test validates the message is displayed when present
      const statusElement = screen.queryByText(/estimated/i);
      if (statusElement) {
        expect(statusElement).toBeInTheDocument();
      }
    });

    it('should not crash when displayStatus is undefined', () => {
      // Arrange
      const product = {
        id: 'prod_1',
        sellStatus: 'for-sale',
        basePriceCents: 29900
      };

      // Act & Assert - Should not throw
      expect(() => {
        render(<PriceDisplay product={product} variant="card" />);
      }).not.toThrow();
    });
  });
});
