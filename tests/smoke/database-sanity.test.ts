/**
 * Database Sanity Smoke Tests
 *
 * These tests run against the ACTUAL working database (not test DB)
 * to verify the system has real data and is operational.
 *
 * Run with: npm run test:smoke
 *
 * IMPORTANT: These tests are READ-ONLY - they never modify data
 */

// Load .env.local instead of .env.test
import "@/tests/helpers/smoke.setup";
import { describe, it, expect } from "vitest";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { products, variants, productSpecs } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Connect to the WORKING database (not test DB)
const WORKING_DB_URL = process.env.SMOKE_TEST_DB_URL || process.env.DATABASE_URL;

if (!WORKING_DB_URL) {
  throw new Error("SMOKE_TEST_DB_URL or DATABASE_URL must be set for smoke tests");
}

describe("Database Sanity Checks (Working Database)", () => {
  let client: postgres.Sql;
  let db: ReturnType<typeof drizzle>;

  // Setup connection once for all tests
  beforeAll(() => {
    client = postgres(WORKING_DB_URL!);
    db = drizzle(client);
    console.log(`\n🔍 Running smoke tests against: ${WORKING_DB_URL.replace(/:[^:@]+@/, ':***@')}\n`);
  });

  // Close connection after all tests
  afterAll(async () => {
    await client.end();
  });

  describe("Database Connectivity", () => {
    it("can connect to database", async () => {
      const result = await client`SELECT 1 as connected`;
      expect(result[0].connected).toBe(1);
    });

    it("has correct database name", async () => {
      const result = await client`SELECT current_database()`;
      const dbName = result[0].current_database;

      // Should NOT be the test database
      expect(dbName).not.toBe("imajin_test");

      // Should be local or dev database
      expect(["imajin_local", "imajin_dev", "imajin_prod"]).toContain(dbName);
    });
  });

  describe("Products Table", () => {
    it("has products in database", async () => {
      const allProducts = await db.select().from(products);

      expect(allProducts.length).toBeGreaterThan(0);
      console.log(`   ✓ Found ${allProducts.length} products in database`);
    });

    it("has products ready to sell (devStatus = 5)", async () => {
      const readyProducts = await db
        .select()
        .from(products)
        .where(and(eq(products.devStatus, 5), eq(products.isActive, true)));

      expect(readyProducts.length).toBeGreaterThan(0);
      console.log(`   ✓ Found ${readyProducts.length} products ready to sell`);
    });

    it("has Material-8x8-V product", async () => {
      const material8x8 = await db
        .select()
        .from(products)
        .where(eq(products.id, "Material-8x8-V"))
        .limit(1);

      expect(material8x8.length).toBe(1);
      expect(material8x8[0].name).toBe("8x8 Void Panel");
      expect(material8x8[0].category).toBe("material");
    });

    it("has Founder Edition kit", async () => {
      const founderKit = await db
        .select()
        .from(products)
        .where(eq(products.hasVariants, true))
        .limit(1);

      expect(founderKit.length).toBeGreaterThan(0);
      if (founderKit.length > 0) {
        expect(founderKit[0].hasVariants).toBe(true);
        console.log(`   ✓ Founder Edition: ${founderKit[0].name} (hasVariants: ${founderKit[0].hasVariants})`);
      }
    });

    it("has reasonable base prices", async () => {
      const allProducts = await db.select().from(products);

      // Check that no products have invalid prices
      allProducts.forEach((product) => {
        expect(product.basePrice).toBeGreaterThan(0);
        expect(product.basePrice).toBeLessThan(1000000); // Less than $10,000
      });
    });
  });

  describe("Variants Table", () => {
    it("has color variants for products with variants", async () => {
      const allVariants = await db.select().from(variants);

      expect(allVariants.length).toBeGreaterThan(0);

      const colors = allVariants.map((v) => v.variantValue);
      console.log(`   ✓ Found ${allVariants.length} total variant(s) with colors: ${colors.join(", ")}`);

      // Check for expected colors (BLACK, WHITE, RED)
      const hasBlack = colors.includes("BLACK");
      const hasWhite = colors.includes("WHITE");
      const hasRed = colors.includes("RED");

      expect(hasBlack || hasWhite || hasRed).toBe(true);
    });

    it("has limited edition quantities set", async () => {
      const limitedVariants = await db
        .select()
        .from(variants)
        .where(eq(variants.isLimitedEdition, true));

      expect(limitedVariants.length).toBeGreaterThan(0);

      limitedVariants.forEach((variant) => {
        expect(variant.maxQuantity).toBeGreaterThan(0);
        expect(variant.soldQuantity).toBeGreaterThanOrEqual(0);
        expect(variant.soldQuantity).toBeLessThanOrEqual(variant.maxQuantity!);
      });

      console.log(`   ✓ Found ${limitedVariants.length} limited edition variants`);
    });

    it("has valid Stripe product IDs", async () => {
      const allVariants = await db.select().from(variants);

      allVariants.forEach((variant) => {
        expect(variant.stripeProductId).toBeTruthy();
        expect(typeof variant.stripeProductId).toBe("string");
      });
    });
  });

  describe("Product Specs Table", () => {
    it("has specifications for products", async () => {
      const allSpecs = await db.select().from(productSpecs);

      expect(allSpecs.length).toBeGreaterThan(0);
      console.log(`   ✓ Found ${allSpecs.length} product specifications`);
    });

    it("has voltage specifications", async () => {
      const voltageSpecs = await db
        .select()
        .from(productSpecs)
        .where(eq(productSpecs.specKey, "voltage"));

      expect(voltageSpecs.length).toBeGreaterThan(0);
      console.log(`   ✓ Found ${voltageSpecs.length} products with voltage specs`);
    });

    it("specs have valid display order", async () => {
      const allSpecs = await db.select().from(productSpecs);

      allSpecs.forEach((spec) => {
        expect(spec.displayOrder).toBeGreaterThanOrEqual(0);
        expect(spec.displayOrder).toBeLessThan(100);
      });
    });
  });

  describe("Data Integrity", () => {
    it("all variants reference existing products", async () => {
      const allVariants = await db.select().from(variants);
      const allProducts = await db.select().from(products);
      const productIds = allProducts.map((p) => p.id);

      allVariants.forEach((variant) => {
        expect(productIds).toContain(variant.productId);
      });
    });

    it("all specs reference existing products", async () => {
      const allSpecs = await db.select().from(productSpecs);
      const allProducts = await db.select().from(products);
      const productIds = allProducts.map((p) => p.id);

      allSpecs.forEach((spec) => {
        expect(productIds).toContain(spec.productId);
      });
    });

    it("products with hasVariants=true actually have variants", async () => {
      const productsWithVariants = await db
        .select()
        .from(products)
        .where(eq(products.hasVariants, true));

      for (const product of productsWithVariants) {
        const productVariants = await db
          .select()
          .from(variants)
          .where(eq(variants.productId, product.id));

        expect(productVariants.length).toBeGreaterThan(0);
        console.log(`   ✓ ${product.name} has ${productVariants.length} variant(s)`);
      }
    });
  });

  describe("Business Rules", () => {
    it("limited edition quantities are reasonable", async () => {
      const limitedVariants = await db
        .select()
        .from(variants)
        .where(eq(variants.isLimitedEdition, true));

      let totalQuantity = 0;
      limitedVariants.forEach((variant) => {
        totalQuantity += variant.maxQuantity || 0;
      });

      // Should have limited edition units configured
      expect(totalQuantity).toBeGreaterThan(0);
      console.log(`   ✓ Total Limited Edition units across all products: ${totalQuantity}`);
    });

    it("sold quantities are within limits", async () => {
      const limitedVariants = await db
        .select()
        .from(variants)
        .where(eq(variants.isLimitedEdition, true));

      limitedVariants.forEach((variant) => {
        const available = (variant.maxQuantity || 0) - (variant.soldQuantity ?? 0);
        expect(available).toBeGreaterThanOrEqual(0);

        if (variant.variantValue) {
          console.log(`   ✓ ${variant.variantValue}: ${available} of ${variant.maxQuantity} available`);
        }
      });
    });
  });
});
