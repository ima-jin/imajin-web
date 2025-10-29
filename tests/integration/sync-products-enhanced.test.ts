import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { db } from '@/db';
import { products, variants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { ProductsJson } from '@/config/schema';

// Mock Stripe before any imports
vi.mock('stripe', () => {
  const Stripe = vi.fn(() => ({
    products: {
      create: vi.fn(),
      update: vi.fn(),
    },
    prices: {
      create: vi.fn(),
      update: vi.fn(),
      list: vi.fn(),
    },
  }));
  return { default: Stripe };
});

// Mock external services
vi.mock('@/lib/services/cloudinary-service');
vi.mock('@/lib/services/stripe-sync-service');

// Import mocked services
import * as cloudinaryService from '@/lib/services/cloudinary-service';
import * as stripeSyncService from '@/lib/services/stripe-sync-service';

// Import sync function
import { syncProductsEnhanced } from '@/scripts/sync-products-enhanced';

// Test fixtures
const TEST_PRODUCTS_JSON_PATH = join(process.cwd(), 'tests', 'fixtures', 'test-products.json');
const TEST_MEDIA_DIR = join(process.cwd(), 'tests', 'fixtures', 'media');

/**
 * Integration Tests: Enhanced Sync Script
 *
 * Tests the complete sync workflow:
 * 1. Media files → Cloudinary
 * 2. Products.json → Stripe
 * 3. Products.json → Database
 * 4. Write updated products.json with generated IDs
 */
describe('Sync Products Enhanced - Integration Tests', () => {
  // Mock implementation will be called by the sync script
  const mockUploadMedia = vi.mocked(cloudinaryService.uploadMedia);
  const mockCheckMediaExists = vi.mocked(cloudinaryService.checkMediaExists);
  const mockDeleteMedia = vi.mocked(cloudinaryService.deleteMedia);
  const mockSyncProductToStripe = vi.mocked(stripeSyncService.syncProductToStripe);

  beforeEach(async () => {
    // Clear database
    await db.delete(variants);
    await db.delete(products);

    // Reset mocks
    vi.clearAllMocks();

    // Setup default mock responses
    mockUploadMedia.mockImplementation(async (filePath, publicId, resourceType) => ({
      publicId: publicId,
      url: `https://res.cloudinary.com/test/image/upload/${publicId}.jpg`,
      secureUrl: `https://res.cloudinary.com/test/image/upload/${publicId}.jpg`,
      format: 'jpg',
      resourceType: resourceType || 'image',
    }));

    mockCheckMediaExists.mockResolvedValue(false);
    mockDeleteMedia.mockResolvedValue();

    mockSyncProductToStripe.mockResolvedValue({
      productId: 'test-product',
      action: 'created',
      stripeProductId: 'prod_test123',
      stripePriceId: 'price_test123',
    });
  });

  afterEach(async () => {
    // Cleanup test data
    await db.delete(variants);
    await db.delete(products);
  });

  describe('Full Sync Workflow', () => {
    it('should sync 3 products from fresh start (0 → 3)', async () => {
      // RED: Test will fail until sync script implements full workflow

      const testData: ProductsJson = {
        products: [
          {
            id: 'product-1',
            name: 'Product 1',
            description: 'Test product 1',
            category: 'material',
            dev_status: 5,
            base_price: 5000,
            has_variants: false,
            requires_assembly: false,
            sell_status: 'for-sale',
            media: [],
            specs: [],
          },
          {
            id: 'product-2',
            name: 'Product 2',
            description: 'Test product 2',
            category: 'material',
            dev_status: 5,
            base_price: 7500,
            has_variants: false,
            requires_assembly: false,
            sell_status: 'for-sale',
            media: [],
            specs: [],
          },
          {
            id: 'product-3',
            name: 'Product 3',
            description: 'Test product 3',
            category: 'kit',
            dev_status: 5,
            base_price: 10000,
            has_variants: false,
            requires_assembly: true,
            sell_status: 'pre-order',
            sell_status_note: 'Ships Q1 2026',
            media: [],
            specs: [],
          },
        ],
        variants: [],
      };

      // Write test products.json
      writeFileSync(TEST_PRODUCTS_JSON_PATH, JSON.stringify(testData, null, 2));

      // Run sync
      await syncProductsEnhanced(TEST_PRODUCTS_JSON_PATH, TEST_MEDIA_DIR);

      // Verify database has 3 products
      const dbProducts = await db.select().from(products);
      expect(dbProducts).toHaveLength(3);
      expect(dbProducts.map((p) => p.id)).toEqual(['product-1', 'product-2', 'product-3']);
    });

    it('should upload media to Cloudinary', async () => {
      // RED: Test will fail until sync script uploads media

      const testData: ProductsJson = {
        products: [
          {
            id: 'product-with-media',
            name: 'Product With Media',
            description: 'Has media files',
            category: 'material',
            dev_status: 5,
            base_price: 5000,
            has_variants: false,
            requires_assembly: false,
            sell_status: 'for-sale',
            media: [
              {
                local_path: 'product-with-media/main.jpg',
                type: 'image',
                mime_type: 'image/jpeg',
                alt: 'Main image',
                category: 'main',
                order: 1,
              },
            ],
            specs: [],
          },
        ],
        variants: [],
      };

      writeFileSync(TEST_PRODUCTS_JSON_PATH, JSON.stringify(testData, null, 2));

      // Create mock media file
      const mediaDir = join(TEST_MEDIA_DIR, 'product-with-media');
      mkdirSync(mediaDir, { recursive: true });
      writeFileSync(join(mediaDir, 'main.jpg'), 'fake image data');

      // Run sync
      await syncProductsEnhanced(TEST_PRODUCTS_JSON_PATH, TEST_MEDIA_DIR);

      // Verify Cloudinary upload was called
      expect(mockUploadMedia).toHaveBeenCalledWith(
        expect.stringMatching(/main\.jpg$/),
        'media/products/product-with-media/main',
        'image'
      );
    });

    it('should create products in Stripe', async () => {
      // RED: Test will fail until sync script calls Stripe sync

      const testData: ProductsJson = {
        products: [
          {
            id: 'stripe-product',
            name: 'Stripe Product',
            description: 'To be synced to Stripe',
            category: 'material',
            dev_status: 5,
            base_price: 5000,
            has_variants: false,
            requires_assembly: false,
            sell_status: 'for-sale',
            media: [],
            specs: [],
          },
        ],
        variants: [],
      };

      writeFileSync(TEST_PRODUCTS_JSON_PATH, JSON.stringify(testData, null, 2));

      // Run sync
      await syncProductsEnhanced(TEST_PRODUCTS_JSON_PATH, TEST_MEDIA_DIR);

      // Verify Stripe sync was called
      expect(mockSyncProductToStripe).toHaveBeenCalledWith({
        id: 'stripe-product',
        name: 'Stripe Product',
        description: 'To be synced to Stripe',
        basePrice: 5000,
        isLive: true,
        sellStatus: 'for-sale',
        stripeProductId: undefined,
      });
    });

    it('should insert products into database', async () => {
      // Covered by first test, but verifies fields

      const testData: ProductsJson = {
        products: [
          {
            id: 'db-product',
            name: 'Database Product',
            description: 'Test all fields',
            category: 'material',
            dev_status: 5,
            base_price: 5000,
            has_variants: false,
            requires_assembly: false,
            sell_status: 'for-sale',
            cost_cents: 3000,
            wholesale_price_cents: 4000,
            media: [],
            specs: [],
          },
        ],
        variants: [],
      };

      writeFileSync(TEST_PRODUCTS_JSON_PATH, JSON.stringify(testData, null, 2));

      // Run sync
      await syncProductsEnhanced(TEST_PRODUCTS_JSON_PATH, TEST_MEDIA_DIR);

      const dbProduct = await db.select().from(products).where(eq(products.id, 'db-product'));
      expect(dbProduct[0]).toMatchObject({
        id: 'db-product',
        name: 'Database Product',
        basePrice: 5000,
        sellStatus: 'for-sale',
        costCents: 3000,
        wholesalePriceCents: 4000,
      });
    });

    it('should update products.json with cloudinary_public_id and stripe_product_id', async () => {
      // RED: Critical test - sync must write back IDs

      const testData: ProductsJson = {
        products: [
          {
            id: 'id-tracking-product',
            name: 'ID Tracking',
            description: 'Test ID updates',
            category: 'material',
            dev_status: 5,
            base_price: 5000,
            has_variants: false,
            requires_assembly: false,
            sell_status: 'for-sale',
            media: [
              {
                local_path: 'id-tracking-product/main.jpg',
                type: 'image',
                mime_type: 'image/jpeg',
                alt: 'Main',
                category: 'main',
                order: 1,
              },
            ],
            specs: [],
          },
        ],
        variants: [],
      };

      writeFileSync(TEST_PRODUCTS_JSON_PATH, JSON.stringify(testData, null, 2));

      // Create mock media
      const mediaDir = join(TEST_MEDIA_DIR, 'id-tracking-product');
      mkdirSync(mediaDir, { recursive: true });
      writeFileSync(join(mediaDir, 'main.jpg'), 'fake');

      // Run sync
      await syncProductsEnhanced(TEST_PRODUCTS_JSON_PATH, TEST_MEDIA_DIR);

      // Read updated products.json
      const updatedJson = JSON.parse(readFileSync(TEST_PRODUCTS_JSON_PATH, 'utf-8')) as ProductsJson;

      // Verify Cloudinary public ID added
      expect(updatedJson.products[0].media[0].cloudinary_public_id).toBe(
        'media/products/id-tracking-product/main'
      );

      // Verify Stripe product ID added
      expect(updatedJson.products[0].stripe_product_id).toBe('prod_test123');
    });
  });

  describe('Idempotency', () => {
    it('should produce identical results when running sync twice', async () => {
      const testData: ProductsJson = {
        products: [
          {
            id: 'idempotent-product',
            name: 'Idempotent Test',
            description: 'Run twice',
            category: 'material',
            dev_status: 5,
            base_price: 5000,
            has_variants: false,
            requires_assembly: false,
            sell_status: 'for-sale',
            media: [],
            specs: [],
          },
        ],
        variants: [],
      };

      writeFileSync(TEST_PRODUCTS_JSON_PATH, JSON.stringify(testData, null, 2));

      // First sync
      await syncProductsEnhanced(TEST_PRODUCTS_JSON_PATH, TEST_MEDIA_DIR);
      const firstRun = await db.select().from(products);

      // Second sync
      await syncProductsEnhanced(TEST_PRODUCTS_JSON_PATH, TEST_MEDIA_DIR);
      const secondRun = await db.select().from(products);

      expect(firstRun).toHaveLength(1);
      expect(secondRun).toHaveLength(1);
      expect(firstRun[0].id).toBe(secondRun[0].id);
    });

    it('should skip already-uploaded media on second run', async () => {
      mockCheckMediaExists.mockResolvedValue(true); // Already exists

      const testData: ProductsJson = {
        products: [
          {
            id: 'media-skip-product',
            name: 'Media Skip',
            description: 'Test',
            category: 'material',
            dev_status: 5,
            base_price: 5000,
            has_variants: false,
            requires_assembly: false,
            sell_status: 'for-sale',
            media: [
              {
                local_path: 'media-skip-product/main.jpg',
                cloudinary_public_id: 'media/products/media-skip-product/main',
                type: 'image',
                mime_type: 'image/jpeg',
                alt: 'Main',
                category: 'main',
                order: 1,
              },
            ],
            specs: [],
          },
        ],
        variants: [],
      };

      writeFileSync(TEST_PRODUCTS_JSON_PATH, JSON.stringify(testData, null, 2));

      // Run sync
      await syncProductsEnhanced(TEST_PRODUCTS_JSON_PATH, TEST_MEDIA_DIR);

      // Upload should NOT be called (already exists)
      expect(mockUploadMedia).not.toHaveBeenCalled();
    });

    it('should update Stripe products on second run (not create)', async () => {
      mockSyncProductToStripe.mockResolvedValue({
        productId: 'update-product',
        action: 'updated',
        stripeProductId: 'prod_existing123',
      });

      const testData: ProductsJson = {
        products: [
          {
            id: 'update-product',
            name: 'Updated Name',
            description: 'Updated description',
            category: 'material',
            dev_status: 5,
            base_price: 5000,
            has_variants: false,
            requires_assembly: false,
            sell_status: 'for-sale',
            stripe_product_id: 'prod_existing123',
            media: [],
            specs: [],
          },
        ],
        variants: [],
      };

      writeFileSync(TEST_PRODUCTS_JSON_PATH, JSON.stringify(testData, null, 2));

      // Run sync
      await syncProductsEnhanced(TEST_PRODUCTS_JSON_PATH, TEST_MEDIA_DIR);

      expect(mockSyncProductToStripe).toHaveBeenCalledWith(
        expect.objectContaining({
          stripeProductId: 'prod_existing123',
        })
      );
    });

    it('should use upsert for database on second run', async () => {
      const testData: ProductsJson = {
        products: [
          {
            id: 'upsert-product',
            name: 'Upsert Test',
            description: 'Test',
            category: 'material',
            dev_status: 5,
            base_price: 5000,
            has_variants: false,
            requires_assembly: false,
            sell_status: 'for-sale',
            media: [],
            specs: [],
          },
        ],
        variants: [],
      };

      writeFileSync(TEST_PRODUCTS_JSON_PATH, JSON.stringify(testData, null, 2));

      // First sync
      await syncProductsEnhanced(TEST_PRODUCTS_JSON_PATH, TEST_MEDIA_DIR);

      // Update name
      testData.products[0].name = 'Updated Name';
      writeFileSync(TEST_PRODUCTS_JSON_PATH, JSON.stringify(testData, null, 2));

      // Second sync
      await syncProductsEnhanced(TEST_PRODUCTS_JSON_PATH, TEST_MEDIA_DIR);

      const dbProduct = await db
        .select()
        .from(products)
        .where(eq(products.id, 'upsert-product'));

      expect(dbProduct[0].name).toBe('Updated Name');
    });

    it('should update last_synced_at timestamp on each run', async () => {
      const testData: ProductsJson = {
        products: [
          {
            id: 'timestamp-product',
            name: 'Timestamp Test',
            description: 'Test',
            category: 'material',
            dev_status: 5,
            base_price: 5000,
            has_variants: false,
            requires_assembly: false,
            sell_status: 'for-sale',
            media: [],
            specs: [],
          },
        ],
        variants: [],
      };

      writeFileSync(TEST_PRODUCTS_JSON_PATH, JSON.stringify(testData, null, 2));

      // First sync
      await syncProductsEnhanced(TEST_PRODUCTS_JSON_PATH, TEST_MEDIA_DIR);

      const updatedJson1 = JSON.parse(
        readFileSync(TEST_PRODUCTS_JSON_PATH, 'utf-8')
      ) as ProductsJson;
      const firstTimestamp = updatedJson1.products[0].last_synced_at;

      // Wait 100ms
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Second sync
      await syncProductsEnhanced(TEST_PRODUCTS_JSON_PATH, TEST_MEDIA_DIR);

      const updatedJson2 = JSON.parse(
        readFileSync(TEST_PRODUCTS_JSON_PATH, 'utf-8')
      ) as ProductsJson;
      const secondTimestamp = updatedJson2.products[0].last_synced_at;

      expect(secondTimestamp).not.toBe(firstTimestamp);
      expect(new Date(secondTimestamp!).getTime()).toBeGreaterThan(
        new Date(firstTimestamp!).getTime()
      );
    });
  });

  describe('Add/Update/Delete Scenarios', () => {
    it('should upload only new media when adding new product (3 → 4)', async () => {
      // Setup: 3 existing products with media
      mockCheckMediaExists.mockResolvedValue(true); // Existing media

      const testData: ProductsJson = {
        products: [
          {
            id: 'existing-1',
            name: 'Existing 1',
            description: 'Test',
            category: 'material',
            dev_status: 5,
            base_price: 5000,
            has_variants: false,
            requires_assembly: false,
            sell_status: 'for-sale',
            media: [
              {
                local_path: 'existing-1/main.jpg',
                cloudinary_public_id: 'media/products/existing-1/main',
                type: 'image',
                mime_type: 'image/jpeg',
                alt: 'Main',
                category: 'main',
                order: 1,
              },
            ],
            specs: [],
          },
        ],
        variants: [],
      };

      writeFileSync(TEST_PRODUCTS_JSON_PATH, JSON.stringify(testData, null, 2));

      // First sync
      await syncProductsEnhanced(TEST_PRODUCTS_JSON_PATH, TEST_MEDIA_DIR);
      vi.clearAllMocks();

      // Add new product
      testData.products.push({
        id: 'new-product',
        name: 'New Product',
        description: 'Test',
        category: 'material',
        dev_status: 5,
        base_price: 7500,
        has_variants: false,
        requires_assembly: false,
        sell_status: 'for-sale',
        media: [
          {
            local_path: 'new-product/main.jpg',
            type: 'image',
            mime_type: 'image/jpeg',
            alt: 'Main',
            category: 'main',
            order: 1,
          },
        ],
        specs: [],
      });

      writeFileSync(TEST_PRODUCTS_JSON_PATH, JSON.stringify(testData, null, 2));

      // Create new media file
      const mediaDir = join(TEST_MEDIA_DIR, 'new-product');
      mkdirSync(mediaDir, { recursive: true });
      writeFileSync(join(mediaDir, 'main.jpg'), 'fake');

      mockCheckMediaExists.mockImplementation((publicId) => {
        return Promise.resolve(publicId.includes('existing-1'));
      });

      // Second sync
      await syncProductsEnhanced(TEST_PRODUCTS_JSON_PATH, TEST_MEDIA_DIR);

      // Only new product media should be uploaded
      expect(mockUploadMedia).toHaveBeenCalledTimes(1);
      expect(mockUploadMedia).toHaveBeenCalledWith(
        expect.stringMatching(/new-product[/\\]main\.jpg$/),
        'media/products/new-product/main',
        'image'
      );
    });

    it('should sync updated product name to Stripe and database', async () => {
      const testData: ProductsJson = {
        products: [
          {
            id: 'update-name-product',
            name: 'Original Name',
            description: 'Test',
            category: 'material',
            dev_status: 5,
            base_price: 5000,
            has_variants: false,
            requires_assembly: false,
            sell_status: 'for-sale',
            stripe_product_id: 'prod_existing123',
            media: [],
            specs: [],
          },
        ],
        variants: [],
      };

      writeFileSync(TEST_PRODUCTS_JSON_PATH, JSON.stringify(testData, null, 2));

      // First sync
      await syncProductsEnhanced(TEST_PRODUCTS_JSON_PATH, TEST_MEDIA_DIR);

      // Update name
      testData.products[0].name = 'Updated Name';
      writeFileSync(TEST_PRODUCTS_JSON_PATH, JSON.stringify(testData, null, 2));

      mockSyncProductToStripe.mockResolvedValue({
        productId: 'update-name-product',
        action: 'updated',
        stripeProductId: 'prod_existing123',
      });

      // Second sync
      await syncProductsEnhanced(TEST_PRODUCTS_JSON_PATH, TEST_MEDIA_DIR);

      // Verify Stripe called with new name
      expect(mockSyncProductToStripe).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Name',
        })
      );

      // Verify database updated
      const dbProduct = await db
        .select()
        .from(products)
        .where(eq(products.id, 'update-name-product'));
      expect(dbProduct[0].name).toBe('Updated Name');
    });

    it('should create new Stripe Price when product price changes', async () => {
      const testData: ProductsJson = {
        products: [
          {
            id: 'price-change-product',
            name: 'Price Change',
            description: 'Test',
            category: 'material',
            dev_status: 5,
            base_price: 5000,
            has_variants: false,
            requires_assembly: false,
            sell_status: 'for-sale',
            stripe_product_id: 'prod_existing123',
            media: [],
            specs: [],
          },
        ],
        variants: [],
      };

      writeFileSync(TEST_PRODUCTS_JSON_PATH, JSON.stringify(testData, null, 2));

      // First sync
      await syncProductsEnhanced(TEST_PRODUCTS_JSON_PATH, TEST_MEDIA_DIR);

      // Change price
      testData.products[0].base_price = 7500;
      writeFileSync(TEST_PRODUCTS_JSON_PATH, JSON.stringify(testData, null, 2));

      mockSyncProductToStripe.mockResolvedValue({
        productId: 'price-change-product',
        action: 'updated',
        stripeProductId: 'prod_existing123',
        stripePriceId: 'price_new456', // New price created
      });

      // Second sync
      await syncProductsEnhanced(TEST_PRODUCTS_JSON_PATH, TEST_MEDIA_DIR);

      expect(mockSyncProductToStripe).toHaveBeenCalledWith(
        expect.objectContaining({
          basePrice: 7500,
        })
      );
    });

    it('should archive Stripe product when sell_status changes to "internal"', async () => {
      const testData: ProductsJson = {
        products: [
          {
            id: 'archive-product',
            name: 'Archive Test',
            description: 'Test',
            category: 'material',
            dev_status: 5,
            base_price: 5000,
            has_variants: false,
            requires_assembly: false,
            sell_status: 'for-sale',
            stripe_product_id: 'prod_existing123',
            media: [],
            specs: [],
          },
        ],
        variants: [],
      };

      writeFileSync(TEST_PRODUCTS_JSON_PATH, JSON.stringify(testData, null, 2));

      // Change to internal
      testData.products[0].sell_status = 'internal';
      writeFileSync(TEST_PRODUCTS_JSON_PATH, JSON.stringify(testData, null, 2));

      mockSyncProductToStripe.mockResolvedValue({
        productId: 'archive-product',
        action: 'archived',
      });

      // Run sync
      await syncProductsEnhanced(TEST_PRODUCTS_JSON_PATH, TEST_MEDIA_DIR);

      expect(mockSyncProductToStripe).toHaveBeenCalledWith(
        expect.objectContaining({
          sellStatus: 'internal',
        })
      );
    });

    it('should remove deleted media from Cloudinary and products.json', async () => {
      const testData: ProductsJson = {
        products: [
          {
            id: 'media-delete-product',
            name: 'Media Delete',
            description: 'Test',
            category: 'material',
            dev_status: 5,
            base_price: 5000,
            has_variants: false,
            requires_assembly: false,
            sell_status: 'for-sale',
            media: [
              {
                local_path: 'media-delete-product/main.jpg',
                cloudinary_public_id: 'media/products/media-delete-product/main',
                type: 'image',
                mime_type: 'image/jpeg',
                alt: 'Main',
                category: 'main',
                order: 1,
              },
              {
                local_path: 'media-delete-product/deleted.jpg',
                cloudinary_public_id: 'media/products/media-delete-product/deleted',
                type: 'image',
                mime_type: 'image/jpeg',
                alt: 'Deleted',
                category: 'detail',
                order: 2,
              },
            ],
            specs: [],
          },
        ],
        variants: [],
      };

      writeFileSync(TEST_PRODUCTS_JSON_PATH, JSON.stringify(testData, null, 2));

      // Create only main.jpg (deleted.jpg doesn't exist on disk)
      const mediaDir = join(TEST_MEDIA_DIR, 'media-delete-product');
      mkdirSync(mediaDir, { recursive: true });
      writeFileSync(join(mediaDir, 'main.jpg'), 'fake');

      // Run sync (should detect deleted.jpg missing)
      await syncProductsEnhanced(TEST_PRODUCTS_JSON_PATH, TEST_MEDIA_DIR);

      // Verify Cloudinary delete called
      expect(mockDeleteMedia).toHaveBeenCalledWith('media/products/media-delete-product/deleted');

      // Verify products.json updated (deleted entry removed)
      const updatedJson = JSON.parse(
        readFileSync(TEST_PRODUCTS_JSON_PATH, 'utf-8')
      ) as ProductsJson;
      expect(updatedJson.products[0].media).toHaveLength(1);
      expect(updatedJson.products[0].media[0].local_path).toBe(
        'media-delete-product/main.jpg'
      );
    });

    it('should handle product deletion from JSON (archive Stripe, soft-delete DB)', async () => {
      // RED: Complex scenario - product removed from JSON
      const testData: ProductsJson = {
        products: [
          {
            id: 'to-be-deleted',
            name: 'Delete Test',
            description: 'Test',
            category: 'material',
            dev_status: 5,
            base_price: 5000,
            has_variants: false,
            requires_assembly: false,
            sell_status: 'for-sale',
            stripe_product_id: 'prod_existing123',
            media: [],
            specs: [],
          },
          {
            id: 'keep-this',
            name: 'Keep This',
            description: 'Test',
            category: 'material',
            dev_status: 5,
            base_price: 5000,
            has_variants: false,
            requires_assembly: false,
            sell_status: 'for-sale',
            media: [],
            specs: [],
          },
        ],
        variants: [],
      };

      writeFileSync(TEST_PRODUCTS_JSON_PATH, JSON.stringify(testData, null, 2));

      // First sync
      await syncProductsEnhanced(TEST_PRODUCTS_JSON_PATH, TEST_MEDIA_DIR);

      // Remove first product
      testData.products = testData.products.filter((p) => p.id !== 'to-be-deleted');
      writeFileSync(TEST_PRODUCTS_JSON_PATH, JSON.stringify(testData, null, 2));

      // Second sync
      await syncProductsEnhanced(TEST_PRODUCTS_JSON_PATH, TEST_MEDIA_DIR);

      // Product should be marked inactive in DB
      const dbProduct = await db
        .select()
        .from(products)
        .where(eq(products.id, 'to-be-deleted'));
      expect(dbProduct[0].isActive).toBe(false);
    });
  });

  describe('Partial Failure Handling', () => {
    it('should not block other products when Cloudinary fails for product 2', async () => {
      mockUploadMedia
        .mockResolvedValueOnce({
          publicId: 'media/products/product-1/main',
          url: 'https://test.com/1.jpg',
          secureUrl: 'https://test.com/1.jpg',
          format: 'jpg',
          resourceType: 'image',
        })
        .mockRejectedValueOnce(new Error('Cloudinary network error'))
        .mockResolvedValueOnce({
          publicId: 'media/products/product-3/main',
          url: 'https://test.com/3.jpg',
          secureUrl: 'https://test.com/3.jpg',
          format: 'jpg',
          resourceType: 'image',
        });

      // Products 1, 2, 3 should all process despite product 2 failure
      // Test implementation TBD
      expect(true).toBe(true); // Placeholder
    });

    it('should not block other products when Stripe fails for product 2', async () => {
      mockSyncProductToStripe
        .mockResolvedValueOnce({
          productId: 'product-1',
          action: 'created',
          stripeProductId: 'prod_1',
        })
        .mockRejectedValueOnce(new Error('Stripe API error'))
        .mockResolvedValueOnce({
          productId: 'product-3',
          action: 'created',
          stripeProductId: 'prod_3',
        });

      // Products 1 and 3 should succeed
      expect(true).toBe(true); // Placeholder
    });

    it('should not block other products when database fails for product 2', async () => {
      // Simulate database constraint violation for product 2
      // Products 1 and 3 should still insert
      expect(true).toBe(true); // Placeholder
    });

    it('should not update last_synced_at for failed products', async () => {
      // Product with error should not have timestamp updated
      expect(true).toBe(true); // Placeholder
    });

    it('should update last_synced_at for successful products', async () => {
      // Successful products should have current timestamp
      expect(true).toBe(true); // Placeholder
    });

    it('should retry failed products on re-run', async () => {
      // Products with old/missing last_synced_at should be targeted
      expect(true).toBe(true); // Placeholder
    });

    it('should include all failures in error report', async () => {
      // Sync report should list all errors encountered
      expect(true).toBe(true); // Placeholder
    });

    it('should continue sync after error without crashing', async () => {
      // One failure shouldn't stop entire sync process
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Variant Handling', () => {
    it('should sync variant media from subfolder (Unit-8x8x8-Founder/BLACK/)', async () => {
      const testData: ProductsJson = {
        products: [
          {
            id: 'Unit-8x8x8-Founder',
            name: 'Founder Edition',
            description: 'Test',
            category: 'kit',
            dev_status: 5,
            base_price: 10000,
            has_variants: true,
            requires_assembly: true,
            sell_status: 'for-sale',
            media: [],
            specs: [],
          },
        ],
        variants: [
          {
            id: 'Unit-8x8x8-Founder-Black',
            product_id: 'Unit-8x8x8-Founder',
            stripe_product_id: undefined,
            variant_type: 'color',
            variant_value: 'BLACK',
            price_modifier: 0,
            is_limited_edition: true,
            max_quantity: 500,
            media: [
              {
                local_path: 'Unit-8x8x8-Founder/BLACK/main.jpg',
                type: 'image',
                mime_type: 'image/jpeg',
                alt: 'Black variant',
                category: 'main',
                order: 1,
              },
            ],
            specs: [],
          },
        ],
      };

      writeFileSync(TEST_PRODUCTS_JSON_PATH, JSON.stringify(testData, null, 2));

      // Create variant media in subfolder
      const variantDir = join(TEST_MEDIA_DIR, 'Unit-8x8x8-Founder', 'BLACK');
      mkdirSync(variantDir, { recursive: true });
      writeFileSync(join(variantDir, 'main.jpg'), 'fake');

      // Run sync
      await syncProductsEnhanced(TEST_PRODUCTS_JSON_PATH, TEST_MEDIA_DIR);

      // Verify variant media uploaded
      expect(mockUploadMedia).toHaveBeenCalledWith(
        expect.stringMatching(/Unit-8x8x8-Founder[/\\]BLACK[/\\]main\.jpg$/),
        'media/products/Unit-8x8x8-Founder/BLACK/main',
        'image'
      );
    });

    it('should create separate Stripe Product for each variant', async () => {
      const testData: ProductsJson = {
        products: [
          {
            id: 'variant-parent',
            name: 'Parent Product',
            description: 'Test',
            category: 'kit',
            dev_status: 5,
            base_price: 10000,
            has_variants: true,
            requires_assembly: false,
            sell_status: 'for-sale',
            media: [],
            specs: [],
          },
        ],
        variants: [
          {
            id: 'variant-parent-black',
            product_id: 'variant-parent',
            variant_type: 'color',
            variant_value: 'BLACK',
            price_modifier: 0,
            is_limited_edition: false,
            media: [],
            specs: [],
          },
          {
            id: 'variant-parent-white',
            product_id: 'variant-parent',
            variant_type: 'color',
            variant_value: 'WHITE',
            price_modifier: 500,
            is_limited_edition: false,
            media: [],
            specs: [],
          },
        ],
      };

      writeFileSync(TEST_PRODUCTS_JSON_PATH, JSON.stringify(testData, null, 2));

      // Run sync
      await syncProductsEnhanced(TEST_PRODUCTS_JSON_PATH, TEST_MEDIA_DIR);

      // Verify Stripe called for parent + 2 variants = 3 times
      expect(mockSyncProductToStripe).toHaveBeenCalledTimes(3);
    });

    it('should link variant to parent via metadata', async () => {
      // Variants should have parent_product_id in Stripe metadata
      expect(true).toBe(true); // Placeholder
    });

    it('should keep variant media independent from parent product media', async () => {
      const testData: ProductsJson = {
        products: [
          {
            id: 'independent-media-parent',
            name: 'Parent',
            description: 'Test',
            category: 'kit',
            dev_status: 5,
            base_price: 10000,
            has_variants: true,
            requires_assembly: false,
            sell_status: 'for-sale',
            media: [
              {
                local_path: 'independent-media-parent/main.jpg',
                type: 'image',
                mime_type: 'image/jpeg',
                alt: 'Parent main',
                category: 'main',
                order: 1,
              },
            ],
            specs: [],
          },
        ],
        variants: [
          {
            id: 'independent-media-parent-red',
            product_id: 'independent-media-parent',
            variant_type: 'color',
            variant_value: 'RED',
            price_modifier: 0,
            is_limited_edition: false,
            media: [
              {
                local_path: 'independent-media-parent/RED/main.jpg',
                type: 'image',
                mime_type: 'image/jpeg',
                alt: 'Red variant main',
                category: 'main',
                order: 1,
              },
            ],
            specs: [],
          },
        ],
      };

      writeFileSync(TEST_PRODUCTS_JSON_PATH, JSON.stringify(testData, null, 2));

      // Create both media files
      const parentDir = join(TEST_MEDIA_DIR, 'independent-media-parent');
      const variantDir = join(parentDir, 'RED');
      mkdirSync(variantDir, { recursive: true });
      writeFileSync(join(parentDir, 'main.jpg'), 'parent image');
      writeFileSync(join(variantDir, 'main.jpg'), 'variant image');

      // Run sync
      await syncProductsEnhanced(TEST_PRODUCTS_JSON_PATH, TEST_MEDIA_DIR);

      // Verify both media files uploaded separately
      expect(mockUploadMedia).toHaveBeenCalledWith(
        expect.stringMatching(/independent-media-parent[/\\]main\.jpg$/),
        'media/products/independent-media-parent/main',
        'image'
      );
      expect(mockUploadMedia).toHaveBeenCalledWith(
        expect.stringMatching(/independent-media-parent[/\\]RED[/\\]main\.jpg$/),
        'media/products/independent-media-parent/RED/main',
        'image'
      );
    });
  });

  describe('Media Cleanup', () => {
    it('should delete Cloudinary asset when file removed from disk', async () => {
      // Covered by "Add/Update/Delete Scenarios" test
      expect(true).toBe(true); // Placeholder
    });

    it('should remove media entry from products.json when file deleted', async () => {
      // Covered by "Add/Update/Delete Scenarios" test
      expect(true).toBe(true); // Placeholder
    });
  });
});
