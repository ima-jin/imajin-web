import { describe, it, expect } from "vitest";
import {
  mapDbProductToProduct,
  mapDbProductsToProducts,
  type DbProduct,
} from "@/lib/mappers/product-mapper";
import { createMockDbProduct } from "@/tests/fixtures/products";

describe("mapDbProductToProduct", () => {
  it("maps valid DB product to application product", () => {
    const dbProduct = createMockDbProduct({
      id: "Material-8x8-V",
      name: "8x8 Void Panel",
      description: "240mm panel",
      category: "material",
      devStatus: 5,
      basePrice: 3500,
      isActive: true,
      requiresAssembly: false,
      hasVariants: false,
      maxQuantity: null,
      soldQuantity: 0,
      availableQuantity: null,
      isAvailable: true,
      createdAt: new Date("2024-10-01"),
      updatedAt: new Date("2024-10-24"),
    });

    const result = mapDbProductToProduct(dbProduct);

    expect(result).toEqual({
      id: "Material-8x8-V",
      name: "8x8 Void Panel",
      description: "240mm panel",
      category: "material",
      devStatus: 5,
      basePrice: 3500,
      isActive: true,
      requiresAssembly: false,
      hasVariants: false,
      maxQuantity: null,
      soldQuantity: 0,
      availableQuantity: null,
      isAvailable: true,
      isLive: true,
      costCents: undefined,
      wholesalePriceCents: undefined,
      sellStatus: 'for-sale',
      sellStatusNote: undefined,
      lastSyncedAt: undefined,
      media: [],
      // Portfolio & Featured Product fields (Phase 2.4.7)
      showOnPortfolioPage: false,
      portfolioCopy: null,
      isFeatured: false,
      createdAt: new Date("2024-10-01"),
      updatedAt: new Date("2024-10-24"),
    });
  });

  it("handles null description", () => {
    const dbProduct = createMockDbProduct({
      id: "test",
      name: "Test Product",
      description: null,
      maxQuantity: 100,
      soldQuantity: 0,
      availableQuantity: 100,
    });

    const result = mapDbProductToProduct(dbProduct);

    expect(result.description).toBeNull();
  });

  it("handles null boolean fields", () => {
    const dbProduct = createMockDbProduct({
      id: "test",
      name: "Test",
      description: "Test",
      isActive: undefined,
      requiresAssembly: undefined,
      hasVariants: undefined,
    });

    const result = mapDbProductToProduct(dbProduct);

    expect(result.isActive).toBeUndefined();
    expect(result.requiresAssembly).toBeUndefined();
    expect(result.hasVariants).toBeUndefined();
  });

  it("handles null timestamps", () => {
    const dbProduct = createMockDbProduct({
      id: "test",
      name: "Test",
      description: "Test",
      maxQuantity: 50,
      soldQuantity: 10,
      availableQuantity: 40,
      createdAt: undefined,
      updatedAt: undefined,
    });

    const result = mapDbProductToProduct(dbProduct);

    expect(result.createdAt).toBeUndefined();
    expect(result.updatedAt).toBeUndefined();
  });
});

describe("mapDbProductsToProducts", () => {
  it("maps array of valid products", () => {
    const dbProducts = [
      createMockDbProduct({
        id: "product-1",
        name: "Product 1",
        description: "Description 1",
        category: "material",
        basePrice: 1000,
      }),
      createMockDbProduct({
        id: "product-2",
        name: "Product 2",
        description: "Description 2",
        category: "connector",
        basePrice: 2000,
        maxQuantity: 1000,
        soldQuantity: 50,
        availableQuantity: 950,
      }),
    ];

    const result = mapDbProductsToProducts(dbProducts);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("product-1");
    expect(result[0].basePrice).toBe(1000);
    expect(result[1].id).toBe("product-2");
    expect(result[1].basePrice).toBe(2000);
  });

  it("returns empty array for empty input", () => {
    const result = mapDbProductsToProducts([]);
    expect(result).toEqual([]);
  });

  it("handles errors gracefully and continues mapping", () => {
    const dbProducts = [
      createMockDbProduct({
        id: "valid-product",
        name: "Valid",
        description: "Valid",
        maxQuantity: 100,
        soldQuantity: 0,
        availableQuantity: 100,
      }),
      // Invalid product missing required fields - will be skipped
      {
        id: "invalid-product",
      } as DbProduct,
    ];

    const result = mapDbProductsToProducts(dbProducts);

    // Should only return the valid product
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("valid-product");
  });
});
