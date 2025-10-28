import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/products/route";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import type { Product } from "@/types/product";

describe.sequential("GET /api/products", () => {
  // Test data IDs - unique prefix to avoid conflicts with other test files
  const testProductIds = ["api-products-active", "api-products-inactive", "api-products-dev"];

  beforeEach(async () => {
    // Insert test products
    await db.insert(products).values([
      {
        id: "api-products-active",
        name: "Active Test Product",
        description: "Ready to sell",
        category: "material",
        devStatus: 5,
        basePrice: 1000,
        isActive: true,
        requiresAssembly: false,
        hasVariants: false,
      },
      {
        id: "api-products-inactive",
        name: "Inactive Test Product",
        description: "Not active",
        category: "material",
        devStatus: 5,
        basePrice: 2000,
        isActive: false,
        requiresAssembly: false,
        hasVariants: false,
      },
      {
        id: "api-products-dev",
        name: "Dev Status Product",
        description: "Still in development",
        category: "connector",
        devStatus: 3,
        basePrice: 3000,
        isActive: true,
        requiresAssembly: false,
        hasVariants: false,
      },
    ]);
  });

  afterEach(async () => {
    // Clean up test products
    for (const id of testProductIds) {
      await db.delete(products).where(eq(products.id, id));
    }
  });

  it("returns 200 status code", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });

  it("returns array of products", async () => {
    const response = await GET();
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  it("returns only active products with dev_status = 5 by default", async () => {
    const response = await GET();
    const json = await response.json();
    const data = json.data as Product[];

    // Should include api-products-active
    const activeProduct = data.find((p) => p.id === "api-products-active");
    expect(activeProduct).toBeDefined();
    expect(activeProduct?.devStatus).toBe(5);
    expect(activeProduct?.isActive).toBe(true);

    // Should NOT include api-products-inactive (isActive = false)
    const inactiveProduct = data.find((p) => p.id === "api-products-inactive");
    expect(inactiveProduct).toBeUndefined();

    // Should NOT include api-products-dev (devStatus = 3)
    const devProduct = data.find((p) => p.id === "api-products-dev");
    expect(devProduct).toBeUndefined();
  });

  it("returns products with correct structure", async () => {
    const response = await GET();
    const json = await response.json();
    const data = json.data as Product[];

    const testProduct = data.find((p) => p.id === "api-products-active");
    expect(testProduct).toBeDefined();

    // Verify product structure (camelCase)
    expect(testProduct).toHaveProperty("id");
    expect(testProduct).toHaveProperty("name");
    expect(testProduct).toHaveProperty("description");
    expect(testProduct).toHaveProperty("category");
    expect(testProduct).toHaveProperty("devStatus");
    expect(testProduct).toHaveProperty("basePrice");
    expect(testProduct).toHaveProperty("isActive");
    expect(testProduct).toHaveProperty("requiresAssembly");
    expect(testProduct).toHaveProperty("hasVariants");
    expect(testProduct).toHaveProperty("createdAt");
    expect(testProduct).toHaveProperty("updatedAt");
  });

  it("supports category filtering", async () => {
    const url = new URL("http://localhost:3000/api/products?category=material");
    const request = {
      nextUrl: url,
    } as unknown as NextRequest;
    const response = await GET(request);
    const json = await response.json();
    const data = json.data as Product[];

    // All returned products should be in material category
    data.forEach((product) => {
      expect(product.category).toBe("material");
    });

    // Should include our material test product
    const materialProduct = data.find((p) => p.id === "api-products-active");
    expect(materialProduct).toBeDefined();
  });

  it("returns all products when invalid category provided (per new spec)", async () => {
    const url = new URL("http://localhost:3000/api/products?category=nonexistent");
    const request = {
      nextUrl: url,
    } as unknown as NextRequest;
    const response = await GET(request);
    const json = await response.json();
    const data = json.data as Product[];

    // New behavior: invalid category returns all products (ignores invalid filter)
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0); // Should return all active products
  });

  it("returns correct content type", async () => {
    const response = await GET();
    const contentType = response.headers.get("content-type");

    expect(contentType).toContain("application/json");
  });

  it("returns valid product data types", async () => {
    const response = await GET();
    const json = await response.json();
    const data = json.data as Product[];

    const testProduct = data.find((p) => p.id === "api-products-active");
    if (testProduct) {
      expect(typeof testProduct.id).toBe("string");
      expect(typeof testProduct.name).toBe("string");
      expect(typeof testProduct.category).toBe("string");
      expect(typeof testProduct.devStatus).toBe("number");
      expect(typeof testProduct.basePrice).toBe("number");
      expect(typeof testProduct.isActive).toBe("boolean");
    }
  });
});
