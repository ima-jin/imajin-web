/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createTestDbConnection,
  closeTestDbConnection,
} from "@/tests/helpers/db-helpers";
import {
  getAllProducts,
  getProductById,
  getProductsByStatus,
  getProductWithVariants,
  getProductWithSpecs,
} from "@/lib/services/product-service";
import { products, variants, productSpecs } from "@/db/schema";
import type { ProductCategory } from "@/types/product";

describe("Product Service", () => {
  let client: any;
  let db: any;

  beforeEach(async () => {
    ({ client, db } = createTestDbConnection());
    // Don't clear all data - let each describe block manage its own test data
  });

  afterEach(async () => {
    // Don't clear all data - let each describe block clean up its own test data
    await closeTestDbConnection(client);
  });

  describe("getAllProducts", () => {
    // Test data IDs for this describe block
    const testIds = ["svc-prod-1", "svc-prod-2", "svc-prod-3", "svc-prod-4"];

    beforeEach(async () => {
      // Seed test products with different statuses
      await db.insert(products).values([
        {
          id: "svc-prod-1",
          name: "Test Product 1",
          category: "material",
          devStatus: 5,
          basePrice: 1000,
          isActive: true,
          hasVariants: false,
          maxQuantity: null,
          soldQuantity: 0,
          isLive: true,
          sellStatus: 'for-sale',
          media: [],
        },
        {
          id: "svc-prod-2",
          name: "Test Product 2",
          category: "connector",
          devStatus: 5,
          basePrice: 500,
          isActive: true,
          hasVariants: false,
          maxQuantity: null,
          soldQuantity: 0,
          isLive: true,
          sellStatus: 'for-sale',
          media: [],
        },
        {
          id: "svc-prod-3",
          name: "Test Product 3 (Dev)",
          category: "material",
          devStatus: 3,
          basePrice: 1500,
          isActive: true,
          hasVariants: false,
          maxQuantity: null,
          soldQuantity: 0,
          isLive: true,
          sellStatus: 'for-sale',
          media: [],
        },
        {
          id: "svc-prod-4",
          name: "Test Product 4 (Inactive)",
          category: "material",
          devStatus: 5,
          basePrice: 2000,
          isActive: false,
          hasVariants: false,
          maxQuantity: null,
          soldQuantity: 0,
          isLive: false,
          sellStatus: 'internal',
          media: [],
        },
      ]);
    });

    afterEach(async () => {
      // Clean up only our test data
      const { eq } = await import("drizzle-orm");
      for (const id of testIds) {
        await db.delete(products).where(eq(products.id, id));
      }
    });

    it("returns only active products with dev_status = 5 by default", async () => {
      const result = await getAllProducts();

      expect(result).toHaveLength(2);
      expect(result.every((p) => p.devStatus === 5)).toBe(true);
      expect(result.every((p) => p.isActive === true)).toBe(true);
    });

    it("filters by category", async () => {
      const result = await getAllProducts({ category: "material" });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("svc-prod-1");
      expect(result[0].category).toBe("material");
    });

    it("filters by devStatus when explicitly provided", async () => {
      const result = await getAllProducts({ devStatus: 3 });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("svc-prod-3");
      expect(result[0].devStatus).toBe(3);
    });

    it("filters by isActive when explicitly provided", async () => {
      const result = await getAllProducts({ isActive: false, devStatus: 5 });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("svc-prod-4");
      expect(result[0].isActive).toBe(false);
    });

    it("returns empty array when no products match filters", async () => {
      // Use a valid category that doesn't exist in test data
      const result = await getAllProducts({ category: "interface" as ProductCategory });

      expect(result).toEqual([]);
    });

    it("combines multiple filters correctly", async () => {
      const result = await getAllProducts({
        category: "material",
        devStatus: 5,
        isActive: true,
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("svc-prod-1");
    });
  });

  describe("getProductById", () => {
    const testIds = ["svc-prod-1"];

    beforeEach(async () => {
      await db.insert(products).values({
        id: "svc-prod-1",
        name: "Test Product",
        category: "material",
        devStatus: 5,
        basePrice: 1000,
        isActive: true,
        hasVariants: false,
        maxQuantity: null,
        soldQuantity: 0,
        isLive: true,
        sellStatus: 'for-sale',
        media: [],
      });
    });

    afterEach(async () => {
      const { eq } = await import("drizzle-orm");
      for (const id of testIds) {
        await db.delete(products).where(eq(products.id, id));
      }
    });

    it("returns product when found", async () => {
      const result = await getProductById("svc-prod-1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("svc-prod-1");
      expect(result?.name).toBe("Test Product");
    });

    it("returns null when product not found", async () => {
      const result = await getProductById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("getProductsByStatus", () => {
    const testIds = ["svc-prod-1", "svc-prod-2", "svc-prod-3"];

    beforeEach(async () => {
      await db.insert(products).values([
        {
          id: "svc-prod-1",
          name: "Status 5 Product 1",
          category: "material",
          devStatus: 5,
          basePrice: 1000,
          isActive: true,
          hasVariants: false,
          maxQuantity: null,
          soldQuantity: 0,
          isLive: true,
          sellStatus: 'for-sale',
          media: [],
        },
        {
          id: "svc-prod-2",
          name: "Status 5 Product 2",
          category: "material",
          devStatus: 5,
          basePrice: 1500,
          isActive: true,
          hasVariants: false,
          maxQuantity: null,
          soldQuantity: 0,
          isLive: true,
          sellStatus: 'for-sale',
          media: [],
        },
        {
          id: "svc-prod-3",
          name: "Status 3 Product",
          category: "material",
          devStatus: 3,
          basePrice: 2000,
          isActive: true,
          hasVariants: false,
          maxQuantity: null,
          soldQuantity: 0,
          isLive: true,
          sellStatus: 'for-sale',
          media: [],
        },
      ]);
    });

    afterEach(async () => {
      const { eq } = await import("drizzle-orm");
      for (const id of testIds) {
        await db.delete(products).where(eq(products.id, id));
      }
    });

    it("returns all products with specified status", async () => {
      const result = await getProductsByStatus(5);

      expect(result).toHaveLength(2);
      expect(result.every((p) => p.devStatus === 5)).toBe(true);
    });

    it("returns empty array when no products have status", async () => {
      const result = await getProductsByStatus(1);

      expect(result).toEqual([]);
    });
  });

  describe("getProductWithVariants", () => {
    const testProductIds = ["svc-prod-variants", "svc-prod-no-variants"];
    const testVariantIds = ["variant-black", "variant-white"];

    beforeEach(async () => {
      // Create product with variants
      await db.insert(products).values({
        id: "svc-prod-variants",
        name: "Product With Variants",
        category: "kit",
        devStatus: 5,
        basePrice: 10000,
        isActive: true,
        hasVariants: true,
        maxQuantity: 1000,
        soldQuantity: 0,
        isLive: true,
        sellStatus: 'for-sale',
        media: [],
      });

      // Add variants
      await db.insert(variants).values([
        {
          id: "variant-black",
          productId: "svc-prod-variants",
          stripeProductId: "stripe_black",
          variantType: "color",
          variantValue: "BLACK",
          priceModifier: 0,
          isLimitedEdition: true,
          maxQuantity: 100,
          soldQuantity: 25,
          media: [],
        },
        {
          id: "variant-white",
          productId: "svc-prod-variants",
          stripeProductId: "stripe_white",
          variantType: "color",
          variantValue: "WHITE",
          priceModifier: 0,
          isLimitedEdition: true,
          maxQuantity: 50,
          soldQuantity: 10,
          media: [],
        },
      ]);

      // Add specs
      await db.insert(productSpecs).values([
        {
          productId: "svc-prod-variants",
          specKey: "voltage",
          specValue: "24",
          specUnit: "v",
          displayOrder: 1,
        },
        {
          productId: "svc-prod-variants",
          specKey: "dimensions",
          specValue: "240 x 240 x 240",
          specUnit: "mm",
          displayOrder: 2,
        },
      ]);
    });

    afterEach(async () => {
      const { eq } = await import("drizzle-orm");
      // Delete in order to respect foreign keys: variants -> specs -> products
      for (const id of testVariantIds) {
        await db.delete(variants).where(eq(variants.id, id));
      }
      for (const id of testProductIds) {
        await db.delete(productSpecs).where(eq(productSpecs.productId, id));
        await db.delete(products).where(eq(products.id, id));
      }
    });

    it("returns product with variants and specs", async () => {
      const result = await getProductWithVariants("svc-prod-variants");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("svc-prod-variants");
      expect(result?.variants).toHaveLength(2);
      expect(result?.specs).toHaveLength(2);
    });

    it("includes variant availability information", async () => {
      const result = await getProductWithVariants("svc-prod-variants");

      const blackVariant = result?.variants.find((v) => v.variantValue === "BLACK");
      expect(blackVariant).toBeDefined();
      expect(blackVariant?.availableQuantity).toBe(75); // 100 - 25
      expect(blackVariant?.isAvailable).toBe(true);
    });

    it("returns empty variants array for product without variants", async () => {
      await db.insert(products).values({
        id: "svc-prod-no-variants",
        name: "Product Without Variants",
        category: "material",
        devStatus: 5,
        basePrice: 1000,
        isActive: true,
        hasVariants: false,
        maxQuantity: null,
        soldQuantity: 0,
        isLive: true,
        sellStatus: 'for-sale',
        media: [],
      });

      const result = await getProductWithVariants("svc-prod-no-variants");

      expect(result).not.toBeNull();
      expect(result?.variants).toEqual([]);
    });

    it("returns null for nonexistent product", async () => {
      const result = await getProductWithVariants("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("getProductWithSpecs", () => {
    const testIds = ["svc-prod-specs", "svc-prod-no-specs"];

    beforeEach(async () => {
      await db.insert(products).values({
        id: "svc-prod-specs",
        name: "Product With Specs",
        category: "material",
        devStatus: 5,
        basePrice: 3500,
        isActive: true,
        hasVariants: false,
        maxQuantity: null,
        soldQuantity: 0,
        isLive: true,
        sellStatus: 'for-sale',
        media: [],
      });

      await db.insert(productSpecs).values([
        {
          productId: "svc-prod-specs",
          specKey: "led_count",
          specValue: "64",
          specUnit: "LEDs",
          displayOrder: 1,
        },
        {
          productId: "svc-prod-specs",
          specKey: "voltage",
          specValue: "5",
          specUnit: "v",
          displayOrder: 2,
        },
        {
          productId: "svc-prod-specs",
          specKey: "power_consumption",
          specValue: "30",
          specUnit: "W",
          displayOrder: 3,
        },
      ]);
    });

    afterEach(async () => {
      const { eq } = await import("drizzle-orm");
      for (const id of testIds) {
        await db.delete(productSpecs).where(eq(productSpecs.productId, id));
        await db.delete(products).where(eq(products.id, id));
      }
    });

    it("returns product with specs ordered by display_order", async () => {
      const result = await getProductWithSpecs("svc-prod-specs");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("svc-prod-specs");
      expect(result?.specs).toHaveLength(3);
      expect(result?.specs[0].specKey).toBe("led_count");
      expect(result?.specs[1].specKey).toBe("voltage");
      expect(result?.specs[2].specKey).toBe("power_consumption");
    });

    it("returns empty specs array for product without specs", async () => {
      await db.insert(products).values({
        id: "svc-prod-no-specs",
        name: "Product Without Specs",
        category: "material",
        devStatus: 5,
        basePrice: 1000,
        isActive: true,
        hasVariants: false,
        maxQuantity: null,
        soldQuantity: 0,
        isLive: true,
        sellStatus: 'for-sale',
        media: [],
      });

      const result = await getProductWithSpecs("svc-prod-no-specs");

      expect(result).not.toBeNull();
      expect(result?.specs).toEqual([]);
    });

    it("returns null for nonexistent product", async () => {
      const result = await getProductWithSpecs("nonexistent");

      expect(result).toBeNull();
    });
  });
});
