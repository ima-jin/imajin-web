import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  syncProductToStripe,
  StripeSyncResult,
  resetStripeClient,
} from '@/lib/services/stripe-sync-service';

// Set environment variable before module loads
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key_12345';

// Create mock functions using vi.hoisted to hoist them before imports
const { mockProducts, mockPrices } = vi.hoisted(() => ({
  mockProducts: {
    create: vi.fn(),
    update: vi.fn(),
  },
  mockPrices: {
    create: vi.fn(),
    update: vi.fn(),
    list: vi.fn(),
  },
}));

// Mock Stripe module
vi.mock('stripe', () => {
  const Stripe = vi.fn(() => ({
    products: mockProducts,
    prices: mockPrices,
  }));
  return { default: Stripe };
});

describe('stripe-sync-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStripeClient();
  });

  afterEach(() => {
    resetStripeClient();
  });

  describe('syncProductToStripe - Create Product', () => {
    it('should create new product when stripe_product_id is missing', async () => {
      const mockProduct = {
        id: 'prod_abc123',
        name: 'Test Product',
        description: 'Test Description',
        active: true,
        default_price: 'price_xyz789',
      };

      const mockPrice = {
        id: 'price_xyz789',
        unit_amount: 5000,
        currency: 'usd',
        active: true,
      };

      mockProducts.create.mockResolvedValue(mockProduct);
      mockPrices.create.mockResolvedValue(mockPrice);
      mockProducts.update.mockResolvedValue(mockProduct);

      const result = await syncProductToStripe({
        id: 'test-product',
        name: 'Test Product',
        description: 'Test Description',
        basePrice: 5000,
        isLive: true,
        sellStatus: 'for-sale',
      });

      expect(result.action).toBe('created');
      expect(result.stripeProductId).toBe('prod_abc123');
      expect(result.stripePriceId).toBe('price_xyz789');
      expect(mockProducts.create).toHaveBeenCalledWith({
        name: 'Test Product',
        description: 'Test Description',
        active: true,
        metadata: {
          local_id: 'test-product',
          sell_status: 'for-sale',
        },
      });
    });

    it('should create product with isLive=false as inactive', async () => {
      const mockProduct = {
        id: 'prod_abc123',
        active: false,
      };

      const mockPrice = {
        id: 'price_xyz789',
      };

      mockProducts.create.mockResolvedValue(mockProduct);
      mockPrices.create.mockResolvedValue(mockPrice);
      mockProducts.update.mockResolvedValue(mockProduct);

      await syncProductToStripe({
        id: 'test-product',
        name: 'Test Product',
        description: 'Test Description',
        basePrice: 5000,
        isLive: false,
        sellStatus: 'for-sale',
      });

      expect(mockProducts.create).toHaveBeenCalledWith(
        expect.objectContaining({
          active: false,
        })
      );
    });
  });

  describe('syncProductToStripe - Update Product', () => {
    it('should update existing product when stripe_product_id exists', async () => {
      mockProducts.update.mockResolvedValue({
        id: 'prod_existing',
        name: 'Updated Product',
      });

      mockPrices.list.mockResolvedValue({
        data: [{ id: 'price_old', unit_amount: 5000, active: true }],
      });

      const result = await syncProductToStripe({
        id: 'test-product',
        name: 'Updated Product',
        description: 'Updated Description',
        basePrice: 5000,
        isLive: true,
        sellStatus: 'for-sale',
        stripeProductId: 'prod_existing',
      });

      expect(result.action).toBe('updated');
      expect(result.stripeProductId).toBe('prod_existing');
      expect(mockProducts.update).toHaveBeenCalledWith('prod_existing', {
        name: 'Updated Product',
        description: 'Updated Description',
        active: true,
        metadata: {
          local_id: 'test-product',
          sell_status: 'for-sale',
        },
      });
    });

    it('should create new price when price changes', async () => {
      const oldPrice = { id: 'price_old', unit_amount: 5000, active: true };
      const newPrice = { id: 'price_new', unit_amount: 6000, active: true };

      mockProducts.update.mockResolvedValue({ id: 'prod_existing' });
      mockPrices.list.mockResolvedValue({ data: [oldPrice] });
      mockPrices.update.mockResolvedValue({ id: 'price_old', active: false });
      mockPrices.create.mockResolvedValue(newPrice);

      await syncProductToStripe({
        id: 'test-product',
        name: 'Test Product',
        description: 'Test Description',
        basePrice: 6000, // Price changed
        isLive: true,
        sellStatus: 'for-sale',
        stripeProductId: 'prod_existing',
      });

      // Should archive old price
      expect(mockPrices.update).toHaveBeenCalledWith('price_old', { active: false });

      // Should create new price
      expect(mockPrices.create).toHaveBeenCalledWith({
        product: 'prod_existing',
        unit_amount: 6000,
        currency: 'usd',
      });

      // Should set new price as default
      expect(mockProducts.update).toHaveBeenCalledWith(
        'prod_existing',
        expect.objectContaining({
          default_price: 'price_new',
        })
      );
    });

    it('should not create new price when price is unchanged', async () => {
      const existingPrice = { id: 'price_existing', unit_amount: 5000, active: true };

      mockProducts.update.mockResolvedValue({ id: 'prod_existing' });
      mockPrices.list.mockResolvedValue({ data: [existingPrice] });

      await syncProductToStripe({
        id: 'test-product',
        name: 'Test Product',
        description: 'Test Description',
        basePrice: 5000, // Same price
        isLive: true,
        sellStatus: 'for-sale',
        stripeProductId: 'prod_existing',
      });

      expect(mockPrices.create).not.toHaveBeenCalled();
      expect(mockPrices.update).not.toHaveBeenCalled();
    });
  });

  describe('syncProductToStripe - Archive Product', () => {
    it('should archive product when sell_status is internal', async () => {
      mockProducts.update.mockResolvedValue({
        id: 'prod_existing',
        active: false,
      });

      const result = await syncProductToStripe({
        id: 'test-product',
        name: 'Test Product',
        description: 'Test Description',
        basePrice: 5000,
        isLive: false,
        sellStatus: 'internal',
        stripeProductId: 'prod_existing',
      });

      expect(result.action).toBe('archived');
      expect(mockProducts.update).toHaveBeenCalledWith('prod_existing', {
        active: false,
      });
    });

    it('should skip when sell_status is internal and no stripe_product_id', async () => {
      const result = await syncProductToStripe({
        id: 'test-product',
        name: 'Test Product',
        description: 'Test Description',
        basePrice: 5000,
        isLive: false,
        sellStatus: 'internal',
      });

      expect(result.action).toBe('skipped');
      expect(mockProducts.create).not.toHaveBeenCalled();
      expect(mockProducts.update).not.toHaveBeenCalled();
    });
  });

  describe('syncProductToStripe - Error Handling', () => {
    it('should return error when Stripe API fails on create', async () => {
      mockProducts.create.mockRejectedValue(new Error('API Error'));

      const result = await syncProductToStripe({
        id: 'test-product',
        name: 'Test Product',
        description: 'Test Description',
        basePrice: 5000,
        isLive: true,
        sellStatus: 'for-sale',
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('API Error');
    });

    it('should return error when Stripe API fails on update', async () => {
      mockProducts.update.mockRejectedValue(new Error('Update failed'));
      mockPrices.list.mockResolvedValue({ data: [] });

      const result = await syncProductToStripe({
        id: 'test-product',
        name: 'Test Product',
        description: 'Test Description',
        basePrice: 5000,
        isLive: true,
        sellStatus: 'for-sale',
        stripeProductId: 'prod_existing',
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Update failed');
    });
  });

  describe('syncProductToStripe - Sell Status', () => {
    it('should handle pre-order status', async () => {
      const mockProduct = { id: 'prod_123' };
      const mockPrice = { id: 'price_123' };

      mockProducts.create.mockResolvedValue(mockProduct);
      mockPrices.create.mockResolvedValue(mockPrice);
      mockProducts.update.mockResolvedValue(mockProduct);

      await syncProductToStripe({
        id: 'test-product',
        name: 'Pre-Order Product',
        description: 'Coming Soon',
        basePrice: 5000,
        isLive: true,
        sellStatus: 'pre-order',
      });

      expect(mockProducts.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            local_id: 'test-product',
            sell_status: 'pre-order',
          },
        })
      );
    });

    it('should handle sold-out status', async () => {
      mockProducts.update.mockResolvedValue({ id: 'prod_existing' });
      mockPrices.list.mockResolvedValue({ data: [] });

      await syncProductToStripe({
        id: 'test-product',
        name: 'Sold Out Product',
        description: 'Out of Stock',
        basePrice: 5000,
        isLive: true,
        sellStatus: 'sold-out',
        stripeProductId: 'prod_existing',
      });

      expect(mockProducts.update).toHaveBeenCalledWith(
        'prod_existing',
        expect.objectContaining({
          metadata: {
            local_id: 'test-product',
            sell_status: 'sold-out',
          },
        })
      );
    });
  });

  describe('syncProductToStripe - With Variants (Phase 2.5.1)', () => {
    it('should create parent product with multiple variant prices', async () => {
      const mockProduct = {
        id: 'prod_founder_edition',
        name: 'Founder Edition Cube',
        active: true,
      };

      const mockPriceBlack = {
        id: 'price_founder_black',
        unit_amount: 129500,
        currency: 'usd',
      };

      const mockPriceWhite = {
        id: 'price_founder_white',
        unit_amount: 129500,
        currency: 'usd',
      };

      const mockPriceRed = {
        id: 'price_founder_red',
        unit_amount: 129500,
        currency: 'usd',
      };

      mockProducts.create.mockResolvedValue(mockProduct);
      mockPrices.create
        .mockResolvedValueOnce(mockPriceBlack)
        .mockResolvedValueOnce(mockPriceWhite)
        .mockResolvedValueOnce(mockPriceRed);

      const result = await syncProductToStripe(
        {
          id: 'Unit-8x8x8-Founder',
          name: 'Founder Edition Cube',
          description: 'Limited edition cube',
          basePrice: 129500,
          isLive: true,
          sellStatus: 'for-sale',
          hasVariants: true,
        },
        [
          {
            id: 'Unit-8x8x8-Founder-BLACK',
            productId: 'Unit-8x8x8-Founder',
            variantType: 'color',
            variantValue: 'BLACK',
            priceModifier: 0,
          },
          {
            id: 'Unit-8x8x8-Founder-WHITE',
            productId: 'Unit-8x8x8-Founder',
            variantType: 'color',
            variantValue: 'WHITE',
            priceModifier: 0,
          },
          {
            id: 'Unit-8x8x8-Founder-RED',
            productId: 'Unit-8x8x8-Founder',
            variantType: 'color',
            variantValue: 'RED',
            priceModifier: 0,
          },
        ]
      );

      expect(result.action).toBe('created');
      expect(result.stripeProductId).toBe('prod_founder_edition');
      expect(result.variantPrices).toHaveLength(3);
      expect(result.variantPrices).toEqual([
        { variantId: 'Unit-8x8x8-Founder-BLACK', stripePriceId: 'price_founder_black' },
        { variantId: 'Unit-8x8x8-Founder-WHITE', stripePriceId: 'price_founder_white' },
        { variantId: 'Unit-8x8x8-Founder-RED', stripePriceId: 'price_founder_red' },
      ]);

      // Should create ONE product
      expect(mockProducts.create).toHaveBeenCalledTimes(1);

      // Should create THREE prices
      expect(mockPrices.create).toHaveBeenCalledTimes(3);
    });

    it('should include variant metadata in prices', async () => {
      const mockProduct = { id: 'prod_test' };
      const mockPrice = { id: 'price_test' };

      mockProducts.create.mockResolvedValue(mockProduct);
      mockPrices.create.mockResolvedValue(mockPrice);

      await syncProductToStripe(
        {
          id: 'test-product',
          name: 'Test Product',
          description: 'Test',
          basePrice: 5000,
          isLive: true,
          sellStatus: 'for-sale',
          hasVariants: true,
        },
        [
          {
            id: 'variant-black',
            productId: 'test-product',
            variantType: 'color',
            variantValue: 'BLACK',
            priceModifier: 0,
          },
        ]
      );

      expect(mockPrices.create).toHaveBeenCalledWith({
        product: 'prod_test',
        unit_amount: 5000,
        currency: 'usd',
        nickname: 'color: BLACK',
        metadata: {
          variant_id: 'variant-black',
          variant_type: 'color',
          variant_value: 'BLACK',
        },
      });
    });

    it('should apply price modifiers to variant prices', async () => {
      const mockProduct = { id: 'prod_test' };
      const mockPriceStandard = { id: 'price_standard' };
      const mockPricePremium = { id: 'price_premium' };

      mockProducts.create.mockResolvedValue(mockProduct);
      mockPrices.create
        .mockResolvedValueOnce(mockPriceStandard)
        .mockResolvedValueOnce(mockPricePremium);

      await syncProductToStripe(
        {
          id: 'test-product',
          name: 'Test Product',
          description: 'Test',
          basePrice: 10000,
          isLive: true,
          sellStatus: 'for-sale',
          hasVariants: true,
        },
        [
          {
            id: 'variant-standard',
            productId: 'test-product',
            variantType: 'size',
            variantValue: 'STANDARD',
            priceModifier: 0,
          },
          {
            id: 'variant-premium',
            productId: 'test-product',
            variantType: 'size',
            variantValue: 'PREMIUM',
            priceModifier: 2000, // $20 more expensive
          },
        ]
      );

      // Standard variant: base price
      expect(mockPrices.create).toHaveBeenCalledWith(
        expect.objectContaining({
          unit_amount: 10000,
        })
      );

      // Premium variant: base price + modifier
      expect(mockPrices.create).toHaveBeenCalledWith(
        expect.objectContaining({
          unit_amount: 12000,
        })
      );
    });

    it('should update existing parent product and create new prices for variants', async () => {
      mockProducts.update.mockResolvedValue({ id: 'prod_existing' });
      mockPrices.list.mockResolvedValue({ data: [] });

      const mockPrice = { id: 'price_new' };
      mockPrices.create.mockResolvedValue(mockPrice);

      const result = await syncProductToStripe(
        {
          id: 'test-product',
          name: 'Updated Product',
          description: 'Updated',
          basePrice: 5000,
          isLive: true,
          sellStatus: 'for-sale',
          hasVariants: true,
          stripeProductId: 'prod_existing',
        },
        [
          {
            id: 'variant-1',
            productId: 'test-product',
            variantType: 'color',
            variantValue: 'BLUE',
            priceModifier: 0,
          },
        ]
      );

      expect(result.action).toBe('updated');
      expect(mockProducts.update).toHaveBeenCalledTimes(1);
      expect(mockPrices.create).toHaveBeenCalledTimes(1);
    });

    it('should handle products without variants (single price)', async () => {
      const mockProduct = { id: 'prod_simple' };
      const mockPrice = { id: 'price_simple' };

      mockProducts.create.mockResolvedValue(mockProduct);
      mockPrices.create.mockResolvedValue(mockPrice);
      mockProducts.update.mockResolvedValue(mockProduct);

      const result = await syncProductToStripe({
        id: 'simple-product',
        name: 'Simple Product',
        description: 'No variants',
        basePrice: 5000,
        isLive: true,
        sellStatus: 'for-sale',
        hasVariants: false,
      });

      expect(result.action).toBe('created');
      expect(result.stripeProductId).toBe('prod_simple');
      expect(result.stripePriceId).toBe('price_simple');
      expect(result.variantPrices).toBeUndefined();

      expect(mockProducts.create).toHaveBeenCalledTimes(1);
      expect(mockPrices.create).toHaveBeenCalledTimes(1);
    });

    it('should not create duplicate price when variant already has stripePriceId and price unchanged', async () => {
      mockProducts.update.mockResolvedValue({ id: 'prod_existing' });
      mockPrices.list.mockResolvedValue({
        data: [
          {
            id: 'price_existing_black',
            unit_amount: 10000,
            active: true,
            metadata: {
              variant_id: 'variant-black',
              variant_type: 'color',
              variant_value: 'BLACK',
            },
          },
        ],
      });

      const result = await syncProductToStripe(
        {
          id: 'test-product',
          name: 'Test Product',
          description: 'Test',
          basePrice: 10000,
          isLive: true,
          sellStatus: 'for-sale',
          hasVariants: true,
          stripeProductId: 'prod_existing',
        },
        [
          {
            id: 'variant-black',
            productId: 'test-product',
            variantType: 'color',
            variantValue: 'BLACK',
            priceModifier: 0,
            stripePriceId: 'price_existing_black',
          },
        ]
      );

      expect(result.action).toBe('updated');
      expect(mockPrices.create).not.toHaveBeenCalled();
      expect(result.variantPrices).toHaveLength(1);
      expect(result.variantPrices?.[0].stripePriceId).toBe('price_existing_black');
    });

    it('should create new price when variant price has changed', async () => {
      const newPrice = { id: 'price_new_black' };

      mockProducts.update.mockResolvedValue({ id: 'prod_existing' });
      mockPrices.list.mockResolvedValue({
        data: [
          {
            id: 'price_old_black',
            unit_amount: 10000,
            active: true,
          },
        ],
      });
      mockPrices.update.mockResolvedValue({ id: 'price_old_black', active: false });
      mockPrices.create.mockResolvedValue(newPrice);

      const result = await syncProductToStripe(
        {
          id: 'test-product',
          name: 'Test Product',
          description: 'Test',
          basePrice: 12000,
          isLive: true,
          sellStatus: 'for-sale',
          hasVariants: true,
          stripeProductId: 'prod_existing',
        },
        [
          {
            id: 'variant-black',
            productId: 'test-product',
            variantType: 'color',
            variantValue: 'BLACK',
            priceModifier: 0,
            stripePriceId: 'price_old_black',
          },
        ]
      );

      expect(result.action).toBe('updated');
      expect(mockPrices.update).toHaveBeenCalledWith('price_old_black', { active: false });
      expect(mockPrices.create).toHaveBeenCalledTimes(1);
      expect(result.variantPrices?.[0].stripePriceId).toBe('price_new_black');
    });

    it('should include variant type in price nickname', async () => {
      const mockProduct = { id: 'prod_test' };
      const mockPrice = { id: 'price_test' };

      mockProducts.create.mockResolvedValue(mockProduct);
      mockPrices.create.mockResolvedValue(mockPrice);

      await syncProductToStripe(
        {
          id: 'test-product',
          name: 'Test Product',
          description: 'Test',
          basePrice: 5000,
          isLive: true,
          sellStatus: 'for-sale',
          hasVariants: true,
        },
        [
          {
            id: 'variant-black',
            productId: 'test-product',
            variantType: 'color',
            variantValue: 'BLACK',
            priceModifier: 0,
          },
        ]
      );

      expect(mockPrices.create).toHaveBeenCalledWith({
        product: 'prod_test',
        unit_amount: 5000,
        currency: 'usd',
        nickname: 'color: BLACK',
        metadata: {
          variant_id: 'variant-black',
          variant_type: 'color',
          variant_value: 'BLACK',
        },
      });
    });
  });
});
