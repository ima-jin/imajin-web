import { describe, it, expect } from "vitest";
import {
  validateVariantAvailability,
  isLowStock,
  isSoldOut,
} from "@/lib/services/product-validator";
import { createMockVariant } from "@/tests/fixtures/product-fixtures";

describe("Product Validator", () => {
  describe("validateVariantAvailability", () => {
    it("returns availability information for variant", () => {
      const variant = createMockVariant({
        id: "test-variant-1",
        productId: "test-product",
        stripeProductId: "stripe_test_123",
        variantType: "color",
        variantValue: "BLACK",
        priceModifier: 0,
        isLimitedEdition: true,
        maxQuantity: 100,
        soldQuantity: 25,
        availableQuantity: 75,
        isAvailable: true,
      });

      const result = validateVariantAvailability(variant);

      expect(result).toEqual({
        variantId: "test-variant-1",
        isAvailable: true,
        availableQuantity: 75,
        maxQuantity: 100,
        soldQuantity: 25,
      });
    });

    it("handles variant with null quantities", () => {
      const variant = createMockVariant({
        id: "test-variant-2",
        productId: "test-product",
        stripeProductId: "stripe_test_456",
        variantType: "color",
        variantValue: "WHITE",
        priceModifier: 0,
        isLimitedEdition: false,
        maxQuantity: null,
        soldQuantity: 0,
        availableQuantity: null,
        isAvailable: true,
      });

      const result = validateVariantAvailability(variant);

      expect(result).toEqual({
        variantId: "test-variant-2",
        isAvailable: true,
        availableQuantity: null,
        maxQuantity: null,
        soldQuantity: 0,
      });
    });
  });

  describe("isLowStock", () => {
    it("returns false for non-limited edition variants", () => {
      const variant = createMockVariant({
        id: "test-variant-3",
        productId: "test-product",
        isLimitedEdition: false,
        maxQuantity: null,
        availableQuantity: null,
      });

      expect(isLowStock(variant)).toBe(false);
    });

    it("returns true when available quantity is at threshold", () => {
      const variant = createMockVariant({
        id: "test-variant-4",
        productId: "test-product",
        isLimitedEdition: true,
        maxQuantity: 100,
        soldQuantity: 90,
        availableQuantity: 10,
      });

      expect(isLowStock(variant, 10)).toBe(true);
    });

    it("returns true when available quantity is below 10% of max", () => {
      const variant = createMockVariant({
        id: "test-variant-5",
        productId: "test-product",
        isLimitedEdition: true,
        maxQuantity: 500,
        soldQuantity: 495,
        availableQuantity: 5,
      });

      // 10% of 500 = 50, so 5 available should be low stock
      expect(isLowStock(variant)).toBe(true);
    });

    it("returns false when available quantity is above threshold", () => {
      const variant = createMockVariant({
        id: "test-variant-6",
        productId: "test-product",
        isLimitedEdition: true,
        maxQuantity: 100,
        soldQuantity: 50,
        availableQuantity: 50,
      });

      expect(isLowStock(variant, 10)).toBe(false);
    });

    it("returns false when variant is sold out (0 available)", () => {
      const variant = createMockVariant({
        id: "test-variant-7",
        productId: "test-product",
        isLimitedEdition: true,
        maxQuantity: 100,
        soldQuantity: 100,
        availableQuantity: 0,
        isAvailable: false,
      });

      expect(isLowStock(variant)).toBe(false);
    });

    it("uses custom threshold when provided", () => {
      const variant = createMockVariant({
        id: "test-variant-8",
        productId: "test-product",
        isLimitedEdition: true,
        maxQuantity: 100,
        soldQuantity: 75,
        availableQuantity: 25,
      });

      expect(isLowStock(variant, 30)).toBe(true); // 25 < 30
      expect(isLowStock(variant, 20)).toBe(false); // 25 > 20
    });
  });

  describe("isSoldOut", () => {
    it("returns true when variant is not available", () => {
      const variant = createMockVariant({
        id: "test-variant-9",
        productId: "test-product",
        isLimitedEdition: true,
        maxQuantity: 100,
        soldQuantity: 100,
        availableQuantity: 0,
        isAvailable: false,
      });

      expect(isSoldOut(variant)).toBe(true);
    });

    it("returns false when variant is available", () => {
      const variant = createMockVariant({
        id: "test-variant-10",
        productId: "test-product",
        isLimitedEdition: true,
        maxQuantity: 100,
        soldQuantity: 50,
        availableQuantity: 50,
      });

      expect(isSoldOut(variant)).toBe(false);
    });

    it("returns false for unlimited variants", () => {
      const variant = createMockVariant({
        id: "test-variant-11",
        productId: "test-product",
        isLimitedEdition: false,
        maxQuantity: null,
        availableQuantity: null,
      });

      expect(isSoldOut(variant)).toBe(false);
    });
  });
});
