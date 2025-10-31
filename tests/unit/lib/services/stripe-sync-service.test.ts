import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  syncProductToStripe,
  StripeSyncResult,
} from '@/lib/services/stripe-sync-service';

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
    // Mock Stripe environment variable
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_mock_key_12345');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
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
});
