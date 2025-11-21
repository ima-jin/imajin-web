import { describe, it, expect } from 'vitest';
import {
  shouldShowProduct,
  getProductDisplayStatus,
  getSellStatusLabel,
  getSellStatusBadgeVariant,
  canAddToCart,
  getAvailabilityMessage,
  filterVisibleProducts,
  getDisplayPrice,
  getDepositAmount,
} from '@/lib/utils/product-display';
import type { Product, Variant } from '@/types/product';

// Helper to create test products
function createTestProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'test-product',
    name: 'Test Product',
    description: 'Test Description',
    category: 'material',
    devStatus: 5,
    basePriceCents: 5000,
    isActive: true,
    requiresAssembly: false,
    hasVariants: false,
    maxQuantity: null,
    maxQuantityPerOrder: null,
    soldQuantity: 0,
    availableQuantity: null,
    isAvailable: true,
    isLive: true,
    costCents: 3000,
    wholesalePriceCents: 4000,
    sellStatus: 'for-sale',
    sellStatusNote: undefined,
    lastSyncedAt: undefined,
    media: [],
    showOnPortfolioPage: false,
    portfolioCopy: null,
    isFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('product-display utilities', () => {
  describe('shouldShowProduct()', () => {
    it('should return true when is_live=true and sell_status="for-sale"', () => {
      const product = createTestProduct({
        isLive: true,
        sellStatus: 'for-sale',
        devStatus: 5,
        isActive: true,
      });

      expect(shouldShowProduct(product)).toBe(true);
    });

    it('should return false when is_live=false', () => {
      const product = createTestProduct({
        isLive: false,
        sellStatus: 'for-sale',
        devStatus: 5,
        isActive: true,
      });

      expect(shouldShowProduct(product)).toBe(false);
    });

    it('should return false when sell_status="internal"', () => {
      const product = createTestProduct({
        isLive: true,
        sellStatus: 'internal',
        devStatus: 5,
        isActive: true,
      });

      expect(shouldShowProduct(product)).toBe(false);
    });

    it('should return true for "pre-order" products when is_live=true', () => {
      const product = createTestProduct({
        isLive: true,
        sellStatus: 'pre-order',
        devStatus: 5,
        isActive: true,
      });

      expect(shouldShowProduct(product)).toBe(true);
    });

    it('should return false for "sold-out" products', () => {
      const product = createTestProduct({
        isLive: true,
        sellStatus: 'sold-out',
        devStatus: 5,
        isActive: true,
      });

      expect(shouldShowProduct(product)).toBe(false);
    });

    it('should return false when devStatus < 5', () => {
      const product = createTestProduct({
        isLive: true,
        sellStatus: 'for-sale',
        devStatus: 3,
        isActive: true,
      });

      expect(shouldShowProduct(product)).toBe(false);
    });

    it('should return false when isActive=false', () => {
      const product = createTestProduct({
        isLive: true,
        sellStatus: 'for-sale',
        devStatus: 5,
        isActive: false,
      });

      expect(shouldShowProduct(product)).toBe(false);
    });
  });

  describe('getProductDisplayStatus()', () => {
    it('should return {label: "Available", canPurchase: true} for "for-sale"', () => {
      const product = createTestProduct({
        isLive: true,
        sellStatus: 'for-sale',
        devStatus: 5,
        isActive: true,
      });

      const status = getProductDisplayStatus(product);

      expect(status.shouldShow).toBe(true);
      expect(status.badge).toBeUndefined(); // No badge for regular availability
    });

    it('should return {label: "Pre-Order", canPurchase: true} for "pre-order"', () => {
      const product = createTestProduct({
        isLive: true,
        sellStatus: 'pre-order',
        sellStatusNote: 'Ships December 2025',
        devStatus: 5,
        isActive: true,
      });

      const status = getProductDisplayStatus(product);

      expect(status.shouldShow).toBe(true);
      expect(status.badge).toEqual({
        text: 'Pre-Order',
        variant: 'warning',
      });
      expect(status.message).toBe('Ships December 2025');
    });

    it('should return {shouldShow: false} for "sold-out" with sellStatus', () => {
      const product = createTestProduct({
        isLive: true,
        sellStatus: 'sold-out',
        sellStatusNote: 'Check back soon',
        devStatus: 5,
        isActive: true,
      });

      const status = getProductDisplayStatus(product);

      // Sold-out products are not shown to customers
      expect(status.shouldShow).toBe(false);
      expect(status.message).toBe('Check back soon');
    });

    it('should return {shouldShow: false} for "internal" products', () => {
      const product = createTestProduct({
        isLive: true,
        sellStatus: 'internal',
        devStatus: 5,
        isActive: true,
      });

      const status = getProductDisplayStatus(product);

      expect(status.shouldShow).toBe(false);
    });

    it('should include sellStatusNote in result when present', () => {
      const product = createTestProduct({
        isLive: true,
        sellStatus: 'pre-order',
        sellStatusNote: 'Shipping December 1, 2025',
        devStatus: 5,
        isActive: true,
      });

      const status = getProductDisplayStatus(product);

      expect(status.message).toBe('Shipping December 1, 2025');
    });

    it('should show low stock badge when availableQuantity is low', () => {
      const product = createTestProduct({
        isLive: true,
        sellStatus: 'for-sale',
        devStatus: 5,
        isActive: true,
        maxQuantity: 100,
        soldQuantity: 95,
        availableQuantity: 5,
      });

      const status = getProductDisplayStatus(product);

      expect(status.shouldShow).toBe(true);
      expect(status.badge).toEqual({
        text: 'Only 5 Left',
        variant: 'warning',
      });
    });

    it('should show sold out when availableQuantity is 0', () => {
      const product = createTestProduct({
        isLive: true,
        sellStatus: 'for-sale',
        devStatus: 5,
        isActive: true,
        maxQuantity: 100,
        soldQuantity: 100,
        availableQuantity: 0,
      });

      const status = getProductDisplayStatus(product);

      expect(status.shouldShow).toBe(true);
      expect(status.badge).toEqual({
        text: 'Sold Out',
        variant: 'danger',
      });
    });
  });

  describe('getSellStatusLabel()', () => {
    it('should return "Available" for "for-sale"', () => {
      expect(getSellStatusLabel('for-sale')).toBe('Available');
    });

    it('should return "Pre-Order" for "pre-order"', () => {
      expect(getSellStatusLabel('pre-order')).toBe('Pre-Order');
    });

    it('should return "Sold Out" for "sold-out"', () => {
      expect(getSellStatusLabel('sold-out')).toBe('Sold Out');
    });

    it('should return "Internal Only" for "internal"', () => {
      expect(getSellStatusLabel('internal')).toBe('Internal Only');
    });
  });

  describe('getSellStatusBadgeVariant()', () => {
    it('should return "success" for "for-sale"', () => {
      expect(getSellStatusBadgeVariant('for-sale')).toBe('success');
    });

    it('should return "warning" for "pre-order"', () => {
      expect(getSellStatusBadgeVariant('pre-order')).toBe('warning');
    });

    it('should return "danger" for "sold-out"', () => {
      expect(getSellStatusBadgeVariant('sold-out')).toBe('danger');
    });

    it('should return "default" for "internal"', () => {
      expect(getSellStatusBadgeVariant('internal')).toBe('default');
    });
  });

  describe('canAddToCart()', () => {
    it('should return true for available products', () => {
      const product = createTestProduct({
        isLive: true,
        sellStatus: 'for-sale',
        devStatus: 5,
        isActive: true,
      });

      expect(canAddToCart(product)).toBe(true);
    });

    it('should return false for sold-out products', () => {
      const product = createTestProduct({
        isLive: true,
        sellStatus: 'sold-out',
        devStatus: 5,
        isActive: true,
      });

      expect(canAddToCart(product)).toBe(false);
    });

    it('should return false for internal products', () => {
      const product = createTestProduct({
        isLive: true,
        sellStatus: 'internal',
        devStatus: 5,
        isActive: true,
      });

      expect(canAddToCart(product)).toBe(false);
    });

    it('should return false when availableQuantity is 0', () => {
      const product = createTestProduct({
        isLive: true,
        sellStatus: 'for-sale',
        devStatus: 5,
        isActive: true,
        maxQuantity: 100,
        soldQuantity: 100,
        availableQuantity: 0,
      });

      expect(canAddToCart(product)).toBe(false);
    });

    it('should return true for pre-order products', () => {
      const product = createTestProduct({
        isLive: true,
        sellStatus: 'pre-order',
        devStatus: 5,
        isActive: true,
      });

      expect(canAddToCart(product)).toBe(true);
    });
  });

  describe('getAvailabilityMessage()', () => {
    it('should return undefined for unlimited inventory products', () => {
      const product = createTestProduct({
        maxQuantity: null,
        availableQuantity: null,
      });

      expect(getAvailabilityMessage(product)).toBeUndefined();
    });

    it('should return "Out of stock" when availableQuantity is 0', () => {
      const product = createTestProduct({
        maxQuantity: 100,
        soldQuantity: 100,
        availableQuantity: 0,
      });

      expect(getAvailabilityMessage(product)).toBe('Out of stock');
    });

    it('should return "Only X remaining" for low stock', () => {
      const product = createTestProduct({
        maxQuantity: 100,
        soldQuantity: 95,
        availableQuantity: 5,
      });

      expect(getAvailabilityMessage(product)).toBe('Only 5 remaining');
    });

    it('should return "In stock" for plenty of inventory', () => {
      const product = createTestProduct({
        maxQuantity: 100,
        soldQuantity: 20,
        availableQuantity: 80,
      });

      expect(getAvailabilityMessage(product)).toBe('In stock');
    });
  });

  describe('filterVisibleProducts()', () => {
    it('should filter to only visible products', () => {
      const products = [
        createTestProduct({ id: '1', isLive: true, sellStatus: 'for-sale', devStatus: 5 }),
        createTestProduct({ id: '2', isLive: false, sellStatus: 'for-sale', devStatus: 5 }),
        createTestProduct({ id: '3', isLive: true, sellStatus: 'internal', devStatus: 5 }),
        createTestProduct({ id: '4', isLive: true, sellStatus: 'pre-order', devStatus: 5 }),
      ];

      const visible = filterVisibleProducts(products);

      expect(visible).toHaveLength(2);
      expect(visible.map((p) => p.id)).toEqual(['1', '4']);
    });

    it('should return empty array when no products are visible', () => {
      const products = [
        createTestProduct({ id: '1', isLive: false, sellStatus: 'for-sale', devStatus: 5 }),
        createTestProduct({ id: '2', isLive: true, sellStatus: 'internal', devStatus: 5 }),
      ];

      const visible = filterVisibleProducts(products);

      expect(visible).toHaveLength(0);
    });
  });

  describe('getDisplayPrice()', () => {
    // Helper to create test variant
    function createTestVariant(overrides: Partial<Variant> = {}): Variant {
      return {
        id: 'test-variant',
        productId: 'test-product',
        stripeProductId: 'prod_test',
        variantType: 'color',
        variantValue: 'BLACK',
        priceModifier: 0,
        wholesalePriceModifier: 0,
        presaleDepositModifier: 0,
        isLimitedEdition: false,
        maxQuantity: null,
        soldQuantity: 0,
        availableQuantity: null,
        isAvailable: true,
        media: [],
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      };
    }

    it('returns null for pre-sale products (hide pricing)', () => {
      const product = createTestProduct({
        sellStatus: 'pre-sale',
        basePriceCents: 100000,
        wholesalePriceCents: 80000,
        presaleDepositPriceCents: 25000,
      });

      const result = getDisplayPrice(product, undefined, false);

      expect(result).toBeNull();
    });

    it('returns wholesale price for pre-order with deposit paid', () => {
      const product = createTestProduct({
        sellStatus: 'pre-order',
        basePriceCents: 129500,
        wholesalePriceCents: 97500,
      });

      const result = getDisplayPrice(product, undefined, true);

      expect(result).toEqual({
        price: 97500,
        type: 'wholesale',
      });
    });

    it('returns base price for pre-order without deposit', () => {
      const product = createTestProduct({
        sellStatus: 'pre-order',
        basePriceCents: 129500,
        wholesalePriceCents: 97500,
      });

      const result = getDisplayPrice(product, undefined, false);

      expect(result).toEqual({
        price: 129500,
        type: 'base',
      });
    });

    it('returns base price for for-sale products', () => {
      const product = createTestProduct({
        sellStatus: 'for-sale',
        basePriceCents: 5000,
      });

      const result = getDisplayPrice(product, undefined, false);

      expect(result).toEqual({
        price: 5000,
        type: 'base',
      });
    });

    it('applies variant price modifier for base price', () => {
      const product = createTestProduct({
        sellStatus: 'for-sale',
        basePriceCents: 5000,
      });
      const variant = createTestVariant({
        priceModifier: 1500,
      });

      const result = getDisplayPrice(product, variant, false);

      expect(result).toEqual({
        price: 6500, // 5000 + 1500
        type: 'base',
      });
    });

    it('applies variant wholesale price modifier for deposit holders', () => {
      const product = createTestProduct({
        sellStatus: 'pre-order',
        basePriceCents: 129500,
        wholesalePriceCents: 97500,
      });
      const variant = createTestVariant({
        wholesalePriceModifier: 2000,
      });

      const result = getDisplayPrice(product, variant, true);

      expect(result).toEqual({
        price: 99500, // 97500 + 2000
        type: 'wholesale',
      });
    });

    it('falls back to base price if wholesale price not set', () => {
      const product = createTestProduct({
        sellStatus: 'pre-order',
        basePriceCents: 10000,
        wholesalePriceCents: undefined,
      });

      const result = getDisplayPrice(product, undefined, true);

      expect(result).toEqual({
        price: 10000,
        type: 'wholesale',
      });
    });

    it('handles null variant gracefully', () => {
      const product = createTestProduct({
        sellStatus: 'for-sale',
        basePriceCents: 5000,
      });

      const result = getDisplayPrice(product, undefined, false);

      expect(result).toEqual({
        price: 5000,
        type: 'base',
      });
    });
  });

  describe('getDepositAmount()', () => {
    function createTestVariant(overrides: Partial<Variant> = {}): Variant {
      return {
        id: 'test-variant',
        productId: 'test-product',
        stripeProductId: 'prod_test',
        variantType: 'color',
        variantValue: 'BLACK',
        priceModifier: 0,
        wholesalePriceModifier: 0,
        presaleDepositModifier: 0,
        isLimitedEdition: false,
        maxQuantity: null,
        soldQuantity: 0,
        availableQuantity: null,
        isAvailable: true,
        media: [],
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      };
    }

    it('returns deposit amount for pre-sale products', () => {
      const product = createTestProduct({
        sellStatus: 'pre-sale',
        presaleDepositPriceCents: 25000,
      });

      const result = getDepositAmount(product);

      expect(result).toBe(25000);
    });

    it('returns null for non-pre-sale products', () => {
      const product = createTestProduct({
        sellStatus: 'for-sale',
        presaleDepositPriceCents: 25000,
      });

      const result = getDepositAmount(product);

      expect(result).toBeNull();
    });

    it('returns null for pre-order products', () => {
      const product = createTestProduct({
        sellStatus: 'pre-order',
        presaleDepositPriceCents: 25000,
      });

      const result = getDepositAmount(product);

      expect(result).toBeNull();
    });

    it('applies variant deposit modifier', () => {
      const product = createTestProduct({
        sellStatus: 'pre-sale',
        presaleDepositPriceCents: 25000,
      });
      const variant = createTestVariant({
        presaleDepositModifier: 5000,
      });

      const result = getDepositAmount(product, variant);

      expect(result).toBe(30000); // 25000 + 5000
    });

    it('handles missing presaleDepositPriceCents', () => {
      const product = createTestProduct({
        sellStatus: 'pre-sale',
        presaleDepositPriceCents: undefined,
      });

      const result = getDepositAmount(product);

      expect(result).toBe(0);
    });

    it('handles null variant gracefully', () => {
      const product = createTestProduct({
        sellStatus: 'pre-sale',
        presaleDepositPriceCents: 25000,
      });

      const result = getDepositAmount(product, undefined);

      expect(result).toBe(25000);
    });
  });
});
