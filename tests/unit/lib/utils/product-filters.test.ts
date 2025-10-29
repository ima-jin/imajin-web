/**
 * Tests for product filtering and display utilities
 */

import { describe, it, expect } from 'vitest';
import {
  shouldShowProduct,
  getProductDisplayStatus,
  isProductReady,
} from '@/lib/utils/product-filters';

describe('product-filters', () => {
  describe('shouldShowProduct()', () => {
    // Test 76: returns true when is_live=true and sell_status="for-sale"
    it('returns true when is_live=true and sell_status="for-sale"', () => {
      const result = shouldShowProduct(true, 'for-sale');
      expect(result).toBe(true);
    });

    // Test 77: returns false when is_live=false
    it('returns false when is_live=false', () => {
      const resultForSale = shouldShowProduct(false, 'for-sale');
      const resultPreOrder = shouldShowProduct(false, 'pre-order');
      expect(resultForSale).toBe(false);
      expect(resultPreOrder).toBe(false);
    });

    // Test 78: returns false when sell_status="internal"
    it('returns false when sell_status="internal"', () => {
      const result = shouldShowProduct(true, 'internal');
      expect(result).toBe(false);
    });

    // Test 79: returns true for "pre-order" products when is_live=true
    it('returns true for "pre-order" products when is_live=true', () => {
      const result = shouldShowProduct(true, 'pre-order');
      expect(result).toBe(true);
    });

    // Test 80: returns true for "sold-out" products when is_live=true
    it('returns true for "sold-out" products when is_live=true (show but disable purchase)', () => {
      const result = shouldShowProduct(true, 'sold-out');
      expect(result).toBe(true);
    });

    // Test 81: handles edge case: is_live=true, sell_status=null
    it('handles edge case: is_live=true, sell_status=null (defaults to false)', () => {
      const result = shouldShowProduct(true, null as any);
      expect(result).toBe(false);
    });
  });

  describe('getProductDisplayStatus()', () => {
    // Test 82: returns {label: "In Stock", canPurchase: true} for "for-sale"
    it('returns {label: "In Stock", canPurchase: true} for "for-sale"', () => {
      const result = getProductDisplayStatus('for-sale');
      expect(result).toEqual({
        label: 'In Stock',
        canPurchase: true,
      });
    });

    // Test 83: returns {label: "Pre-Order", canPurchase: true, note} for "pre-order"
    it('returns {label: "Pre-Order", canPurchase: true, note} for "pre-order"', () => {
      const result = getProductDisplayStatus('pre-order', 'Ships in 4-6 weeks');
      expect(result).toEqual({
        label: 'Pre-Order',
        canPurchase: true,
        note: 'Ships in 4-6 weeks',
      });
    });

    // Test 84: returns {label: "Sold Out", canPurchase: false, note} for "sold-out"
    it('returns {label: "Sold Out", canPurchase: false, note} for "sold-out"', () => {
      const result = getProductDisplayStatus('sold-out', 'Founder Edition exhausted');
      expect(result).toEqual({
        label: 'Sold Out',
        canPurchase: false,
        note: 'Founder Edition exhausted',
      });
    });

    // Test 85: returns {label: "Not Available", canPurchase: false} for "internal"
    it('returns {label: "Not Available", canPurchase: false} for "internal"', () => {
      const result = getProductDisplayStatus('internal');
      expect(result).toEqual({
        label: 'Not Available',
        canPurchase: false,
      });
    });

    // Test 86: includes sellStatusNote in result when present
    it('includes sellStatusNote in result when present', () => {
      const resultForSale = getProductDisplayStatus('for-sale', 'Limited quantity available');
      const resultSoldOut = getProductDisplayStatus('sold-out', 'Check back soon');

      expect(resultForSale.note).toBe('Limited quantity available');
      expect(resultSoldOut.note).toBe('Check back soon');
    });
  });

  describe('isProductReady()', () => {
    // Test 87: returns true when dev_status=5
    it('returns true when dev_status=5', () => {
      const result = isProductReady(5);
      expect(result).toBe(true);
    });

    // Test 88: returns false when dev_status<5
    it('returns false when dev_status<5', () => {
      expect(isProductReady(1)).toBe(false);
      expect(isProductReady(2)).toBe(false);
      expect(isProductReady(3)).toBe(false);
      expect(isProductReady(4)).toBe(false);
    });
  });

  describe('Edge cases', () => {
    // Test 89: handles missing sell_status field (defaults to "internal")
    it('handles missing sell_status field (defaults to "internal")', () => {
      const resultShow = shouldShowProduct(true, undefined as any);
      const resultStatus = getProductDisplayStatus(undefined as any);

      expect(resultShow).toBe(false);
      expect(resultStatus.label).toBe('Not Available');
      expect(resultStatus.canPurchase).toBe(false);
    });

    // Test 90: handles invalid sell_status value (defaults to unavailable)
    it('handles invalid sell_status value (defaults to unavailable)', () => {
      const resultShow = shouldShowProduct(true, 'invalid-status' as any);
      const resultStatus = getProductDisplayStatus('invalid-status' as any);

      expect(resultShow).toBe(false);
      expect(resultStatus.label).toBe('Not Available');
      expect(resultStatus.canPurchase).toBe(false);
    });
  });
});
