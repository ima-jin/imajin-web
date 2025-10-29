import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/products/[id]/route";
import { db } from "@/db";
import { products, variants, productSpecs } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import type { ProductWithVariants } from "@/types/product";

describe.sequential("GET /api/products/[id]", () => {
  // Test data IDs - unique prefix to avoid conflicts with other test files
  const testProductIds = ["api-prod-detail-1", "api-prod-detail-variants", "api-prod-detail-inactive"];
  const testVariantIds = ["api-variant-black", "api-variant-white"];

  beforeEach(async () => {
    // Insert test products
    await db.insert(products).values([
      {
        id: "api-prod-detail-1",
        name: "Simple Test Product",
        description: "A simple product without variants",
        category: "material",
        devStatus: 5,
        basePrice: 3500,
        isActive: true,
        requiresAssembly: false,
        hasVariants: false,
        maxQuantity: null,
        soldQuantity: 0,
        isLive: true,
        sellStatus: 'for-sale',
        media: [],
      },
      {
        id: "api-prod-detail-variants",
        name: "Product With Variants",
        description: "A product with color variants",
        category: "kit",
        devStatus: 5,
        basePrice: 10000,
        isActive: true,
        requiresAssembly: true,
        hasVariants: true,
        maxQuantity: 1000,
        soldQuantity: 0,
        isLive: true,
        sellStatus: 'for-sale',
        media: [],
      },
      {
        id: "api-prod-detail-inactive",
        name: "Inactive Product",
        description: "Not active",
        category: "material",
        devStatus: 3,
        basePrice: 2000,
        isActive: false,
        requiresAssembly: false,
        hasVariants: false,
        maxQuantity: null,
        soldQuantity: 0,
        isLive: false,
        sellStatus: 'internal',
        media: [],
      },
    ]);

    // Insert variants for the product with variants
    await db.insert(variants).values([
      {
        id: "api-variant-black",
        productId: "api-prod-detail-variants",
        stripeProductId: "stripe_black",
        variantType: "color",
        variantValue: "BLACK",
        priceModifier: 0,
        isLimitedEdition: true,
        maxQuantity: 500,
        soldQuantity: 50,
        media: [],
      },
      {
        id: "api-variant-white",
        productId: "api-prod-detail-variants",
        stripeProductId: "stripe_white",
        variantType: "color",
        variantValue: "WHITE",
        priceModifier: 0,
        isLimitedEdition: true,
        maxQuantity: 300,
        soldQuantity: 30,
        media: [],
      },
    ]);

    // Insert specs for both products
    await db.insert(productSpecs).values([
      {
        productId: "api-prod-detail-1",
        specKey: "led_count",
        specValue: "64",
        specUnit: "LEDs",
        displayOrder: 1,
      },
      {
        productId: "api-prod-detail-1",
        specKey: "voltage",
        specValue: "5",
        specUnit: "v",
        displayOrder: 2,
      },
      {
        productId: "api-prod-detail-variants",
        specKey: "voltage",
        specValue: "24",
        specUnit: "v",
        displayOrder: 1,
      },
      {
        productId: "api-prod-detail-variants",
        specKey: "warranty_years",
        specValue: "10",
        specUnit: "years",
        displayOrder: 2,
      },
    ]);
  });

  afterEach(async () => {
    // Clean up test data in correct order (foreign key constraints)
    for (const id of testVariantIds) {
      await db.delete(variants).where(eq(variants.id, id));
    }
    for (const id of testProductIds) {
      await db.delete(productSpecs).where(eq(productSpecs.productId, id));
      await db.delete(products).where(eq(products.id, id));
    }
  });

  it("returns 200 status code for existing product", async () => {
    const response = await GET({} as NextRequest, { params: Promise.resolve({ id: "api-prod-detail-1" }) });
    expect(response.status).toBe(200);
  });

  it("returns 404 status code for non-existent product", async () => {
    const response = await GET({} as NextRequest, { params: Promise.resolve({ id: "nonexistent-id" }) });
    expect(response.status).toBe(404);
  });

  it("returns product with correct structure", async () => {
    const response = await GET({} as NextRequest, { params: Promise.resolve({ id: "api-prod-detail-1" }) });
    const json = await response.json();
    const data = json.data as ProductWithVariants;

    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("name");
    expect(data).toHaveProperty("description");
    expect(data).toHaveProperty("category");
    expect(data).toHaveProperty("devStatus");
    expect(data).toHaveProperty("basePrice");
    expect(data).toHaveProperty("isActive");
    expect(data).toHaveProperty("requiresAssembly");
    expect(data).toHaveProperty("hasVariants");
    expect(data).toHaveProperty("variants");
    expect(data).toHaveProperty("specs");
    expect(data).toHaveProperty("createdAt");
    expect(data).toHaveProperty("updatedAt");
  });

  it("returns product with empty variants array when hasVariants is false", async () => {
    const response = await GET({} as NextRequest, { params: Promise.resolve({ id: "api-prod-detail-1" }) });
    const json = await response.json();
    const data = json.data as ProductWithVariants;

    expect(data.id).toBe("api-prod-detail-1");
    expect(data.hasVariants).toBe(false);
    expect(data.variants).toEqual([]);
    expect(data.specs).toHaveLength(2);
  });

  it("returns product with variants when hasVariants is true", async () => {
    const response = await GET({} as NextRequest, { params: Promise.resolve({ id: "api-prod-detail-variants" }) });
    const json = await response.json();
    const data = json.data as ProductWithVariants;

    expect(data.id).toBe("api-prod-detail-variants");
    expect(data.hasVariants).toBe(true);
    expect(data.variants).toHaveLength(2);

    // Verify variant structure
    const blackVariant = data.variants.find((v) => v.variantValue === "BLACK");
    expect(blackVariant).toBeDefined();
    expect(blackVariant?.availableQuantity).toBe(450); // 500 - 50
    expect(blackVariant?.isAvailable).toBe(true);

    const whiteVariant = data.variants.find((v) => v.variantValue === "WHITE");
    expect(whiteVariant).toBeDefined();
    expect(whiteVariant?.availableQuantity).toBe(270); // 300 - 30
    expect(whiteVariant?.isAvailable).toBe(true);
  });

  it("returns product with specs in correct order", async () => {
    const response = await GET({} as NextRequest, { params: Promise.resolve({ id: "api-prod-detail-1" }) });
    const json = await response.json();
    const data = json.data as ProductWithVariants;

    expect(data.specs).toHaveLength(2);
    expect(data.specs[0].specKey).toBe("led_count");
    expect(data.specs[1].specKey).toBe("voltage");
  });

  it("returns correct data types", async () => {
    const response = await GET({} as NextRequest, { params: Promise.resolve({ id: "api-prod-detail-1" }) });
    const json = await response.json();
    const data = json.data as ProductWithVariants;

    expect(typeof data.id).toBe("string");
    expect(typeof data.name).toBe("string");
    expect(typeof data.description).toBe("string");
    expect(typeof data.category).toBe("string");
    expect(typeof data.devStatus).toBe("number");
    expect(typeof data.basePrice).toBe("number");
    expect(typeof data.isActive).toBe("boolean");
    expect(typeof data.requiresAssembly).toBe("boolean");
    expect(typeof data.hasVariants).toBe("boolean");
    expect(Array.isArray(data.variants)).toBe(true);
    expect(Array.isArray(data.specs)).toBe(true);
  });

  it("returns correct content type", async () => {
    const response = await GET({} as NextRequest, { params: Promise.resolve({ id: "api-prod-detail-1" }) });
    const contentType = response.headers.get("content-type");

    expect(contentType).toContain("application/json");
  });

  it("returns 404 with error message for non-existent product", async () => {
    const response = await GET({} as NextRequest, { params: Promise.resolve({ id: "nonexistent-id" }) });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error).toHaveProperty("message");
    expect(json.error.message).toContain("not found");
  });

  it("returns inactive product when accessed by ID", async () => {
    // Unlike the list endpoint, detail endpoint should return any product by ID
    const response = await GET({} as NextRequest, { params: Promise.resolve({ id: "api-prod-detail-inactive" }) });
    const json = await response.json();
    const data = json.data;

    expect(response.status).toBe(200);
    expect(data.id).toBe("api-prod-detail-inactive");
    expect(data.isActive).toBe(false);
    expect(data.devStatus).toBe(3);
  });
});
