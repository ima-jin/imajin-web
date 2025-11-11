import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/db';
import { products, variants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { syncProducts } from '@/scripts/sync-products';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import type { ProductsJson } from '@/config/schema';

/**
 * Integration Tests: Sync Products Script
 *
 * Tests the basic sync workflow from products.json to database,
 * specifically focusing on Stripe ID persistence for variants.
 */

const TEST_PRODUCTS_JSON_PATH = join(process.cwd(), 'tests', 'fixtures', 'test-sync-products.json');

describe('sync-products.ts - Stripe ID Persistence', () => {
  beforeEach(async () => {
    // Clean up test data
    await db.delete(variants);
    await db.delete(products);
  });

  afterEach(async () => {
    // Clean up test file if exists
    try {
      unlinkSync(TEST_PRODUCTS_JSON_PATH);
    } catch {
      // Ignore if file doesn't exist
    }
  });

  describe('Variant Stripe ID Fields', () => {
    it('should persist both stripe_product_id and stripe_price_id for variants', async () => {
      // Arrange: Create test products.json with parent product and variants
      const testData: ProductsJson = {
        version: '1.0',
        updated: '2025-11-06',
        products: [
          {
            id: 'test-product',
            name: 'Test Product',
            description: 'Test product with variants',
            long_description: 'Test product long description',
            category: 'unit',
            dev_status: 5,
            base_price: 10000,
            has_variants: true,
            requires_assembly: false,
            is_live: true,
            sell_status: 'for-sale',
            stripe_product_id: 'prod_test_parent_123',
            specs: [],
          },
        ],
        variants: [
          {
            id: 'test-product-black',
            product_id: 'test-product',
            stripe_product_id: 'prod_test_parent_123', // Parent product ID
            stripe_price_id: 'price_test_black_456', // Individual variant price
            variant_type: 'color',
            variant_value: 'BLACK',
            price_modifier: 0,
            is_limited_edition: false,
          },
          {
            id: 'test-product-white',
            product_id: 'test-product',
            stripe_product_id: 'prod_test_parent_123', // Parent product ID
            stripe_price_id: 'price_test_white_789', // Individual variant price
            variant_type: 'color',
            variant_value: 'WHITE',
            price_modifier: 500,
            is_limited_edition: false,
          },
        ],
      };

      writeFileSync(TEST_PRODUCTS_JSON_PATH, JSON.stringify(testData, null, 2));

      // Act: Run sync
      await syncProducts(TEST_PRODUCTS_JSON_PATH);

      // Assert: Verify both fields are persisted in database
      const blackVariant = await db.query.variants.findFirst({
        where: eq(variants.id, 'test-product-black'),
      });

      const whiteVariant = await db.query.variants.findFirst({
        where: eq(variants.id, 'test-product-white'),
      });

      // Both variants should exist
      expect(blackVariant).toBeDefined();
      expect(whiteVariant).toBeDefined();

      // Check BLACK variant
      expect(blackVariant!.stripeProductId).toBe('prod_test_parent_123');
      expect(blackVariant!.stripePriceId).toBe('price_test_black_456');

      // Check WHITE variant
      expect(whiteVariant!.stripeProductId).toBe('prod_test_parent_123');
      expect(whiteVariant!.stripePriceId).toBe('price_test_white_789');
    });

    it('should handle variants with only stripe_price_id (no stripe_product_id in JSON)', async () => {
      // Arrange: Simulate current products.json structure where variants don't have stripe_product_id
      const testData: ProductsJson = {
        version: '1.0',
        updated: '2025-11-06',
        products: [
          {
            id: 'test-product-2',
            name: 'Test Product 2',
            description: 'Test product with variants',
            long_description: 'Test product long description',
            category: 'unit',
            dev_status: 5,
            base_price: 10000,
            has_variants: true,
            requires_assembly: false,
            is_live: true,
            sell_status: 'for-sale',
            stripe_product_id: 'prod_test_parent_999',
            specs: [],
          },
        ],
        variants: [
          {
            id: 'test-product-2-red',
            product_id: 'test-product-2',
            // NOTE: No stripe_product_id in variant (like current products.json)
            stripe_price_id: 'price_test_red_111',
            variant_type: 'color',
            variant_value: 'RED',
            price_modifier: 0,
            is_limited_edition: false,
          },
        ],
      };

      writeFileSync(TEST_PRODUCTS_JSON_PATH, JSON.stringify(testData, null, 2));

      // Act: Run sync
      await syncProducts(TEST_PRODUCTS_JSON_PATH);

      // Assert: Variant should get parent product's stripe_product_id
      const redVariant = await db.query.variants.findFirst({
        where: eq(variants.id, 'test-product-2-red'),
      });

      expect(redVariant).toBeDefined();
      expect(redVariant!.stripeProductId).toBe('prod_test_parent_999'); // From parent product
      expect(redVariant!.stripePriceId).toBe('price_test_red_111'); // From variant
    });
  });
});
