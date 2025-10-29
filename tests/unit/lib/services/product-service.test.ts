/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "@/db";
import {
  getAllProducts,
  getProductById,
  getProductsByStatus,
  getProductWithVariants,
} from "@/lib/services/product-service";
import type { ProductCategory, DevStatus } from "@/types/product";

// Mock the database
vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("product-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllProducts", () => {
    it("should return all active products with dev_status = 5 by default", async () => {
      const mockProducts = [
        {
          id: "Material-8x8-V",
          name: "8x8 Void Panel",
          description: "240mm panel",
          category: "material" as ProductCategory,
          devStatus: 5 as DevStatus,
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
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock the query chain
      const whereFn = vi.fn().mockResolvedValue(mockProducts);
      const selectFn = vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: whereFn }) });
      (db.select as any).mockReturnValue(selectFn());

      const result = await getAllProducts();

      expect(result).toEqual(mockProducts);
      expect(whereFn).toHaveBeenCalled();
    });

    it("should filter products by category when specified", async () => {
      const mockProducts = [
        {
          id: "Material-8x8-V",
          name: "8x8 Void Panel",
          description: "240mm panel",
          category: "material" as ProductCategory,
          devStatus: 5 as DevStatus,
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
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const whereFn = vi.fn().mockResolvedValue(mockProducts);
      const selectFn = vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: whereFn }) });
      (db.select as any).mockReturnValue(selectFn());

      const result = await getAllProducts({ category: "material" });

      expect(result).toEqual(mockProducts);
      expect(whereFn).toHaveBeenCalled();
    });

    it("should return empty array when no products match filters", async () => {
      const whereFn = vi.fn().mockResolvedValue([]);
      const selectFn = vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: whereFn }) });
      (db.select as any).mockReturnValue(selectFn());

      const result = await getAllProducts({ category: "nonexistent" as ProductCategory });

      expect(result).toEqual([]);
    });
  });

  describe("getProductById", () => {
    it("should return product by id", async () => {
      const mockProduct = {
        id: "Material-8x8-V",
        name: "8x8 Void Panel",
        description: "240mm panel",
        category: "material" as ProductCategory,
        devStatus: 5 as DevStatus,
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const whereFn = vi.fn().mockResolvedValue([mockProduct]);
      const selectFn = vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: whereFn }) });
      (db.select as any).mockReturnValue(selectFn());

      const result = await getProductById("Material-8x8-V");

      expect(result).toEqual(mockProduct);
      expect(whereFn).toHaveBeenCalled();
    });

    it("should return null when product not found", async () => {
      const whereFn = vi.fn().mockResolvedValue([]);
      const selectFn = vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: whereFn }) });
      (db.select as any).mockReturnValue(selectFn());

      const result = await getProductById("NonExistent");

      expect(result).toBeNull();
    });
  });

  describe("getProductsByStatus", () => {
    it("should return products filtered by dev_status", async () => {
      const mockProducts = [
        {
          id: "Material-8x8-V",
          name: "8x8 Void Panel",
          description: "240mm panel",
          category: "material" as ProductCategory,
          devStatus: 5 as DevStatus,
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
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const whereFn = vi.fn().mockResolvedValue(mockProducts);
      const selectFn = vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: whereFn }) });
      (db.select as any).mockReturnValue(selectFn());

      const result = await getProductsByStatus(5);

      expect(result).toEqual(mockProducts);
      expect(whereFn).toHaveBeenCalled();
    });

    it("should return empty array when no products have specified status", async () => {
      const whereFn = vi.fn().mockResolvedValue([]);
      const selectFn = vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: whereFn }) });
      (db.select as any).mockReturnValue(selectFn());

      const result = await getProductsByStatus(1);

      expect(result).toEqual([]);
    });
  });

  describe("getProductWithVariants", () => {
    it("should return product with its variants", async () => {
      const mockProduct = {
        id: "Unit-8x8x8-Founder",
        name: "Founder Edition Cube",
        description: "Limited edition cube",
        category: "kit" as ProductCategory,
        devStatus: 5 as DevStatus,
        basePrice: 99500,
        isActive: true,
        requiresAssembly: false,
        hasVariants: true,
        maxQuantity: 1000,
        soldQuantity: 0,
        availableQuantity: 1000,
        isAvailable: true,
        isLive: true,
        costCents: undefined,
        wholesalePriceCents: undefined,
        sellStatus: 'for-sale',
        sellStatusNote: undefined,
        lastSyncedAt: undefined,
        media: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockVariants = [
        {
          id: "Unit-8x8x8-Founder-Black",
          productId: "Unit-8x8x8-Founder",
          stripeProductId: "prod_founder_black",
          variantType: "color",
          variantValue: "BLACK",
          priceModifier: 0,
          isLimitedEdition: true,
          maxQuantity: 500,
          soldQuantity: 0,
          availableQuantity: 500,
          isAvailable: true,
          media: [],
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockSpecs = [
        {
          id: 1,
          productId: "Unit-8x8x8-Founder",
          specKey: "dimensions",
          specValue: "240 x 240 x 240",
          specUnit: "mm",
          displayOrder: 1,
        },
      ];

      // Mock product query
      const productWhereFn = vi.fn().mockResolvedValue([mockProduct]);
      const productSelectFn = vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: productWhereFn }) });

      // Mock variants query
      const variantsWhereFn = vi.fn().mockResolvedValue(mockVariants);
      const variantsSelectFn = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({ where: variantsWhereFn }),
      });

      // Mock specs query
      const specsWhereFn = vi.fn().mockResolvedValue(mockSpecs);
      const specsSelectFn = vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: specsWhereFn }) });

      (db.select as any)
        .mockReturnValueOnce(productSelectFn())
        .mockReturnValueOnce(specsSelectFn())
        .mockReturnValueOnce(variantsSelectFn());

      const result = await getProductWithVariants("Unit-8x8x8-Founder");

      expect(result).toBeDefined();
      expect(result?.id).toBe("Unit-8x8x8-Founder");
      expect(result?.variants).toHaveLength(1);
      expect(result?.specs).toHaveLength(1);
    });

    it("should return null when product not found", async () => {
      const whereFn = vi.fn().mockResolvedValue([]);
      const selectFn = vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: whereFn }) });
      (db.select as any).mockReturnValue(selectFn());

      const result = await getProductWithVariants("NonExistent");

      expect(result).toBeNull();
    });
  });
});
