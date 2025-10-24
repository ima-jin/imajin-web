import { describe, it, expect } from "vitest";
import {
  mapDbProductToProduct,
  mapDbProductsToProducts,
  type DbProduct,
} from "@/lib/mappers/product-mapper";

describe("mapDbProductToProduct", () => {
  it("maps valid DB product to application product", () => {
    const dbProduct = {
      id: "Material-8x8-V",
      name: "8x8 Void Panel",
      description: "240mm panel",
      category: "material",
      devStatus: 5,
      basePrice: 3500,
      isActive: true,
      requiresAssembly: false,
      hasVariants: false,
      createdAt: new Date("2024-10-01"),
      updatedAt: new Date("2024-10-24"),
    };

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
      createdAt: new Date("2024-10-01"),
      updatedAt: new Date("2024-10-24"),
    });
  });

  it("handles null description", () => {
    const dbProduct = {
      id: "test",
      name: "Test Product",
      description: null,
      category: "material",
      devStatus: 5,
      basePrice: 1000,
      isActive: true,
      requiresAssembly: false,
      hasVariants: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = mapDbProductToProduct(dbProduct);

    expect(result.description).toBeNull();
  });

  it("handles null boolean fields", () => {
    const dbProduct = {
      id: "test",
      name: "Test",
      description: "Test",
      category: "material",
      devStatus: 5,
      basePrice: 1000,
      isActive: null,
      requiresAssembly: null,
      hasVariants: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = mapDbProductToProduct(dbProduct);

    expect(result.isActive).toBeNull();
    expect(result.requiresAssembly).toBeNull();
    expect(result.hasVariants).toBeNull();
  });

  it("handles null timestamps", () => {
    const dbProduct = {
      id: "test",
      name: "Test",
      description: "Test",
      category: "material",
      devStatus: 5,
      basePrice: 1000,
      isActive: true,
      requiresAssembly: false,
      hasVariants: false,
      createdAt: null,
      updatedAt: null,
    };

    const result = mapDbProductToProduct(dbProduct);

    expect(result.createdAt).toBeNull();
    expect(result.updatedAt).toBeNull();
  });
});

describe("mapDbProductsToProducts", () => {
  it("maps array of valid products", () => {
    const dbProducts = [
      {
        id: "product-1",
        name: "Product 1",
        description: "Description 1",
        category: "material",
        devStatus: 5,
        basePrice: 1000,
        isActive: true,
        requiresAssembly: false,
        hasVariants: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "product-2",
        name: "Product 2",
        description: "Description 2",
        category: "connector",
        devStatus: 5,
        basePrice: 2000,
        isActive: true,
        requiresAssembly: false,
        hasVariants: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
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
      {
        id: "valid-product",
        name: "Valid",
        description: "Valid",
        category: "material",
        devStatus: 5,
        basePrice: 1000,
        isActive: true,
        requiresAssembly: false,
        hasVariants: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
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
