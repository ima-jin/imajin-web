/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateCart } from '@/lib/services/cart-validator';
import type { CartItem } from '@/types/cart';
import { db } from '@/db';

// Mock the database
vi.mock('@/db', () => ({
  db: {
    query: {
      products: {
        findMany: vi.fn(),
      },
      variants: {
        findMany: vi.fn(),
      },
      productDependencies: {
        findMany: vi.fn(),
      },
    },
  },
}));

describe('cart-validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateCart', () => {
    it('validates empty cart as valid', async () => {
      const result = await validateCart([]);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('detects unavailable products (devStatus != 5)', async () => {
      const items: CartItem[] = [
        {
          productId: 'unavailable-product',
          name: 'Unavailable Product',
          price: 5000,
          stripeProductId: 'price_test',
          image: '/test.jpg',
          quantity: 1,
        },
      ];

      vi.mocked(db.query.products.findMany).mockResolvedValue([
        { id: 'unavailable-product', devStatus: 3 },
      ] as any);
      vi.mocked(db.query.productDependencies.findMany).mockResolvedValue([]);

      const result = await validateCart(items);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        productId: 'unavailable-product',
        type: 'unavailable',
        message: expect.stringContaining('no longer available'),
      });
    });

    it('passes validation for available products (devStatus = 5)', async () => {
      const items: CartItem[] = [
        {
          productId: 'available-product',
          name: 'Available Product',
          price: 5000,
          stripeProductId: 'price_test',
          image: '/test.jpg',
          quantity: 1,
        },
      ];

      vi.mocked(db.query.products.findMany).mockResolvedValue([
        { id: 'available-product', devStatus: 5 },
      ] as any);
      vi.mocked(db.query.productDependencies.findMany).mockResolvedValue([]);

      const result = await validateCart(items);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects sold out limited edition variants', async () => {
      const items: CartItem[] = [
        {
          productId: 'founder-edition',
          variantId: 'founder-black',
          name: 'Founder Edition - BLACK',
          price: 50000,
          stripeProductId: 'price_test',
          image: '/test.jpg',
          quantity: 1,
          isLimitedEdition: true,
        },
      ];

      vi.mocked(db.query.products.findMany).mockResolvedValue([
        { id: 'founder-edition', devStatus: 5 },
      ] as any);
      vi.mocked(db.query.variants.findMany).mockResolvedValue([
        {
          id: 'founder-black',
          maxQuantity: 500,
          soldQuantity: 500, // Sold out
        },
      ] as any);
      vi.mocked(db.query.productDependencies.findMany).mockResolvedValue([]);

      const result = await validateCart(items);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        productId: 'founder-edition',
        variantId: 'founder-black',
        type: 'out_of_stock',
        message: expect.stringContaining('sold out'),
      });
    });

    it('detects insufficient quantity for limited edition', async () => {
      const items: CartItem[] = [
        {
          productId: 'founder-edition',
          variantId: 'founder-black',
          name: 'Founder Edition - BLACK',
          price: 50000,
          stripeProductId: 'price_test',
          image: '/test.jpg',
          quantity: 10, // Trying to buy 10
          isLimitedEdition: true,
        },
      ];

      vi.mocked(db.query.products.findMany).mockResolvedValue([
        { id: 'founder-edition', devStatus: 5 },
      ] as any);
      vi.mocked(db.query.variants.findMany).mockResolvedValue([
        {
          id: 'founder-black',
          maxQuantity: 500,
          soldQuantity: 495, // Only 5 remaining
        },
      ] as any);
      vi.mocked(db.query.productDependencies.findMany).mockResolvedValue([]);

      const result = await validateCart(items);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        type: 'out_of_stock',
        message: expect.stringContaining('Only 5 units'),
      });
    });

    it('warns about low stock for limited edition', async () => {
      const items: CartItem[] = [
        {
          productId: 'founder-edition',
          variantId: 'founder-black',
          name: 'Founder Edition - BLACK',
          price: 50000,
          stripeProductId: 'price_test',
          image: '/test.jpg',
          quantity: 1,
          isLimitedEdition: true,
        },
      ];

      vi.mocked(db.query.products.findMany).mockResolvedValue([
        { id: 'founder-edition', devStatus: 5 },
      ] as any);
      vi.mocked(db.query.variants.findMany).mockResolvedValue([
        {
          id: 'founder-black',
          maxQuantity: 500,
          soldQuantity: 495, // Only 5 remaining (low stock)
        },
      ] as any);
      vi.mocked(db.query.productDependencies.findMany).mockResolvedValue([]);

      const result = await validateCart(items);

      expect(result.valid).toBe(true); // Still valid, just warning
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toMatchObject({
        type: 'low_stock',
        message: expect.stringContaining('Only 5 units'),
      });
    });

    it('detects voltage mismatch (5v + 24v)', async () => {
      const items: CartItem[] = [
        {
          productId: 'control-2-5v',
          name: 'Control-2-5v',
          price: 15000,
          stripeProductId: 'price_test',
          image: '/test.jpg',
          quantity: 1,
          voltage: '5v',
        },
        {
          productId: 'control-8-24v',
          name: 'Control-8-24v',
          price: 25000,
          stripeProductId: 'price_test',
          image: '/test.jpg',
          quantity: 1,
          voltage: '24v',
        },
      ];

      vi.mocked(db.query.products.findMany).mockResolvedValue([
        { id: 'control-2-5v', devStatus: 5 },
        { id: 'control-8-24v', devStatus: 5 },
      ] as any);
      vi.mocked(db.query.productDependencies.findMany).mockResolvedValue([]);

      const result = await validateCart(items);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        type: 'voltage_mismatch',
        message: expect.stringContaining('Cannot mix 5v and 24v'),
      });
    });

    it('allows cart with only 5v components', async () => {
      const items: CartItem[] = [
        {
          productId: 'control-2-5v',
          name: 'Control-2-5v',
          price: 15000,
          stripeProductId: 'price_test',
          image: '/test.jpg',
          quantity: 1,
          voltage: '5v',
        },
        {
          productId: 'connector-5v',
          name: '5v Connector',
          price: 500,
          stripeProductId: 'price_test',
          image: '/test.jpg',
          quantity: 4,
          voltage: '5v',
        },
      ];

      vi.mocked(db.query.products.findMany).mockResolvedValue([
        { id: 'control-2-5v', devStatus: 5 },
        { id: 'connector-5v', devStatus: 5 },
      ] as any);
      vi.mocked(db.query.productDependencies.findMany).mockResolvedValue([]);

      const result = await validateCart(items);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('allows cart with only 24v components', async () => {
      const items: CartItem[] = [
        {
          productId: 'control-8-24v',
          name: 'Control-8-24v',
          price: 25000,
          stripeProductId: 'price_test',
          image: '/test.jpg',
          quantity: 1,
          voltage: '24v',
        },
        {
          productId: 'connector-24v',
          name: '24v Connector',
          price: 500,
          stripeProductId: 'price_test',
          image: '/test.jpg',
          quantity: 8,
          voltage: '24v',
        },
      ];

      vi.mocked(db.query.products.findMany).mockResolvedValue([
        { id: 'control-8-24v', devStatus: 5 },
        { id: 'connector-24v', devStatus: 5 },
      ] as any);
      vi.mocked(db.query.productDependencies.findMany).mockResolvedValue([]);

      const result = await validateCart(items);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('warns about missing required dependencies', async () => {
      const items: CartItem[] = [
        {
          productId: 'material-8x8-v',
          name: 'Material-8x8-V',
          price: 20000,
          stripeProductId: 'price_test',
          image: '/test.jpg',
          quantity: 8,
        },
      ];

      vi.mocked(db.query.products.findMany).mockResolvedValue([
        { id: 'material-8x8-v', devStatus: 5 },
      ] as any);
      vi.mocked(db.query.productDependencies.findMany).mockResolvedValue([
        {
          productId: 'material-8x8-v',
          dependsOnProductId: 'spine-connector',
          dependencyType: 'requires',
          message: 'Panels require spine connectors',
        },
      ] as any);

      const result = await validateCart(items);

      expect(result.valid).toBe(true); // Valid but with warnings
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toMatchObject({
        type: 'missing_component',
        message: expect.stringContaining('Panels require spine connectors'),
        suggestedProductId: 'spine-connector',
      });
    });

    it('warns about suggested products', async () => {
      const items: CartItem[] = [
        {
          productId: 'material-8x8-v',
          name: 'Material-8x8-V',
          price: 20000,
          stripeProductId: 'price_test',
          image: '/test.jpg',
          quantity: 8,
        },
      ];

      vi.mocked(db.query.products.findMany).mockResolvedValue([
        { id: 'material-8x8-v', devStatus: 5 },
      ] as any);
      vi.mocked(db.query.productDependencies.findMany).mockResolvedValue([
        {
          productId: 'material-8x8-v',
          dependsOnProductId: 'diffusion-cap-round',
          dependencyType: 'suggests',
          message: 'Consider adding diffusion caps for better light quality',
        },
      ] as any);

      const result = await validateCart(items);

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toMatchObject({
        type: 'suggested_product',
        message: expect.stringContaining('Consider adding diffusion caps'),
        suggestedProductId: 'diffusion-cap-round',
      });
    });

    it('does not warn about dependencies already in cart', async () => {
      const items: CartItem[] = [
        {
          productId: 'material-8x8-v',
          name: 'Material-8x8-V',
          price: 20000,
          stripeProductId: 'price_test',
          image: '/test.jpg',
          quantity: 8,
        },
        {
          productId: 'spine-connector',
          name: 'Spine Connector',
          price: 500,
          stripeProductId: 'price_test',
          image: '/test.jpg',
          quantity: 7,
        },
      ];

      vi.mocked(db.query.products.findMany).mockResolvedValue([
        { id: 'material-8x8-v', devStatus: 5 },
        { id: 'spine-connector', devStatus: 5 },
      ] as any);
      vi.mocked(db.query.productDependencies.findMany).mockResolvedValue([
        {
          productId: 'material-8x8-v',
          dependsOnProductId: 'spine-connector',
          dependencyType: 'requires',
          message: 'Panels require spine connectors',
        },
      ] as any);

      const result = await validateCart(items);

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0); // No warning since spine-connector is in cart
    });

    it('handles multiple errors and warnings', async () => {
      const items: CartItem[] = [
        {
          productId: 'unavailable-product',
          name: 'Unavailable Product',
          price: 5000,
          stripeProductId: 'price_test',
          image: '/test.jpg',
          quantity: 1,
        },
        {
          productId: 'control-2-5v',
          name: 'Control-2-5v',
          price: 15000,
          stripeProductId: 'price_test',
          image: '/test.jpg',
          quantity: 1,
          voltage: '5v',
        },
        {
          productId: 'control-8-24v',
          name: 'Control-8-24v',
          price: 25000,
          stripeProductId: 'price_test',
          image: '/test.jpg',
          quantity: 1,
          voltage: '24v',
        },
      ];

      vi.mocked(db.query.products.findMany).mockResolvedValue([
        { id: 'unavailable-product', devStatus: 3 },
        { id: 'control-2-5v', devStatus: 5 },
        { id: 'control-8-24v', devStatus: 5 },
      ] as any);
      vi.mocked(db.query.productDependencies.findMany).mockResolvedValue([]);

      const result = await validateCart(items);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2); // Unavailable + voltage mismatch
    });
  });
});
