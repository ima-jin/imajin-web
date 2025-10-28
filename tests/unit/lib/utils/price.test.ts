import { describe, it, expect } from 'vitest';
import {
  validatePrice,
  isValidPrice,
  centsToDollars,
  dollarsToCents,
  formatCurrency,
  formatPriceRange,
  calculateSubtotal,
  calculateTax,
  calculateDiscount,
  applyDiscount,
  priceDifference,
  priceChangePercent,
  formatPriceWithDiscount,
  parseCurrencyString,
} from '@/lib/utils/price';

describe('Price Utilities', () => {
  describe('validatePrice', () => {
    it('should accept valid prices', () => {
      expect(validatePrice(0)).toBe(0);
      expect(validatePrice(100)).toBe(100);
      expect(validatePrice(9999)).toBe(9999);
    });

    it('should reject negative prices', () => {
      expect(() => validatePrice(-1)).toThrow();
    });

    it('should reject non-integers', () => {
      expect(() => validatePrice(99.99)).toThrow();
    });

    it('should reject non-numbers', () => {
      expect(() => validatePrice('100')).toThrow();
      expect(() => validatePrice(null)).toThrow();
    });
  });

  describe('isValidPrice', () => {
    it('should return true for valid prices', () => {
      expect(isValidPrice(0)).toBe(true);
      expect(isValidPrice(9999)).toBe(true);
    });

    it('should return false for invalid prices', () => {
      expect(isValidPrice(-1)).toBe(false);
      expect(isValidPrice(99.99)).toBe(false);
      expect(isValidPrice('100')).toBe(false);
    });
  });

  describe('centsToDollars', () => {
    it('should convert cents to dollars', () => {
      expect(centsToDollars(0)).toBe(0);
      expect(centsToDollars(100)).toBe(1);
      expect(centsToDollars(9999)).toBe(99.99);
      expect(centsToDollars(12345)).toBe(123.45);
    });
  });

  describe('dollarsToCents', () => {
    it('should convert dollars to cents', () => {
      expect(dollarsToCents(0)).toBe(0);
      expect(dollarsToCents(1)).toBe(100);
      expect(dollarsToCents(99.99)).toBe(9999);
      expect(dollarsToCents(123.45)).toBe(12345);
    });

    it('should round to nearest cent', () => {
      expect(dollarsToCents(1.234)).toBe(123);
      expect(dollarsToCents(1.235)).toBe(124);
      expect(dollarsToCents(1.236)).toBe(124);
    });
  });

  describe('formatCurrency', () => {
    it('should format cents as USD by default', () => {
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(100)).toBe('$1.00');
      expect(formatCurrency(9999)).toBe('$99.99');
      expect(formatCurrency(123456)).toBe('$1,234.56');
    });

    it('should format without currency symbol', () => {
      expect(formatCurrency(9999, { showCurrency: false })).toBe('99.99');
    });

    it('should handle different locales', () => {
      // Note: Results depend on Node.js ICU data
      const formatted = formatCurrency(9999, { locale: 'en-CA' });
      expect(formatted).toContain('99.99');
    });

    it('should handle large numbers', () => {
      expect(formatCurrency(1000000)).toBe('$10,000.00');
      expect(formatCurrency(99999999)).toBe('$999,999.99');
    });
  });

  describe('formatPriceRange', () => {
    it('should format price range', () => {
      expect(formatPriceRange(5000, 10000)).toBe('$50.00 - $100.00');
    });

    it('should show single price if min equals max', () => {
      expect(formatPriceRange(5000, 5000)).toBe('$50.00');
    });
  });

  describe('calculateSubtotal', () => {
    it('should calculate subtotal for multiple items', () => {
      const items = [
        { price: 1000, quantity: 2 },
        { price: 500, quantity: 3 },
      ];
      expect(calculateSubtotal(items)).toBe(3500); // (1000*2) + (500*3)
    });

    it('should handle empty cart', () => {
      expect(calculateSubtotal([])).toBe(0);
    });

    it('should handle single item', () => {
      expect(calculateSubtotal([{ price: 1000, quantity: 1 }])).toBe(1000);
    });
  });

  describe('calculateTax', () => {
    it('should calculate tax correctly', () => {
      expect(calculateTax(10000, 0.13)).toBe(1300); // 13% of $100
      expect(calculateTax(5000, 0.05)).toBe(250); // 5% of $50
    });

    it('should round to nearest cent', () => {
      expect(calculateTax(1000, 0.133)).toBe(133); // Rounds 133.3
    });

    it('should handle zero tax rate', () => {
      expect(calculateTax(10000, 0)).toBe(0);
    });
  });

  describe('calculateDiscount', () => {
    it('should calculate discount amount', () => {
      expect(calculateDiscount(10000, 20)).toBe(2000); // 20% of $100
      expect(calculateDiscount(5000, 10)).toBe(500); // 10% of $50
    });

    it('should handle 100% discount', () => {
      expect(calculateDiscount(10000, 100)).toBe(10000);
    });

    it('should handle 0% discount', () => {
      expect(calculateDiscount(10000, 0)).toBe(0);
    });
  });

  describe('applyDiscount', () => {
    it('should apply discount to price', () => {
      expect(applyDiscount(10000, 20)).toBe(8000); // $100 - 20% = $80
      expect(applyDiscount(5000, 50)).toBe(2500); // $50 - 50% = $25
    });

    it('should handle 100% discount', () => {
      expect(applyDiscount(10000, 100)).toBe(0);
    });
  });

  describe('priceDifference', () => {
    it('should calculate price difference', () => {
      expect(priceDifference(10000, 5000)).toBe(5000);
      expect(priceDifference(5000, 10000)).toBe(-5000);
      expect(priceDifference(5000, 5000)).toBe(0);
    });
  });

  describe('priceChangePercent', () => {
    it('should calculate percentage change', () => {
      expect(priceChangePercent(10000, 12000)).toBe(20); // 20% increase
      expect(priceChangePercent(10000, 8000)).toBe(-20); // 20% decrease
      expect(priceChangePercent(10000, 10000)).toBe(0); // No change
    });

    it('should handle zero original price', () => {
      expect(priceChangePercent(0, 1000)).toBe(0);
    });
  });

  describe('formatPriceWithDiscount', () => {
    it('should format price without discount', () => {
      const result = formatPriceWithDiscount(10000);
      expect(result.original).toBe('$100.00');
      expect(result.discounted).toBeUndefined();
      expect(result.savings).toBeUndefined();
    });

    it('should format price with discount', () => {
      const result = formatPriceWithDiscount(10000, 8000);
      expect(result.original).toBe('$100.00');
      expect(result.discounted).toBe('$80.00');
      expect(result.savings).toBe('$20.00');
      expect(result.savingsPercent).toBe(20);
    });

    it('should handle same original and discounted price', () => {
      const result = formatPriceWithDiscount(10000, 10000);
      expect(result.original).toBe('$100.00');
      expect(result.discounted).toBeUndefined();
    });
  });

  describe('parseCurrencyString', () => {
    it('should parse currency strings', () => {
      expect(parseCurrencyString('$99.99')).toBe(9999);
      expect(parseCurrencyString('99.99')).toBe(9999);
      expect(parseCurrencyString('$100')).toBe(10000);
      expect(parseCurrencyString('100')).toBe(10000);
      expect(parseCurrencyString('$1,234.56')).toBe(123456);
    });

    it('should return null for invalid strings', () => {
      expect(parseCurrencyString('invalid')).toBeNull();
      expect(parseCurrencyString('')).toBeNull();
      expect(parseCurrencyString('$')).toBeNull();
    });
  });
});
