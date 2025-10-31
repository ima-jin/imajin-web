import { describe, it, expect } from "vitest";
import { validateProductJson, validateVariantAvailability } from "@/lib/services/product-validator";
import { createMockDbVariant as createMockVariant } from "@/tests/fixtures/products";

describe("product-validator", () => {
  describe("validateProductJson", () => {
    it("should validate correct product JSON", () => {
      const validProduct = {
        id: "Material-8x8-V",
        name: "8x8 Void Panel",
        description: "240mm, 8×8 prototype PCB from 2024",
        category: "material",
        dev_status: 5,
        base_price: 3500,
        stripe_product_id: "prod_TFqJ6019ONDct2",
        has_variants: false,
        images: ["https://cloudinary.com/image1.jpg"],
        specs: [
          {
            key: "dimensions",
            value: "240 x 240",
            unit: "mm",
            display_order: 1,
          },
        ],
      };

      const result = validateProductJson(validProduct);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("Material-8x8-V");
      }
    });

    it("should reject invalid product JSON", () => {
      const invalidProduct = {
        id: "Material-8x8-V",
        name: "8x8 Void Panel",
        // Missing required fields
      };

      const result = validateProductJson(invalidProduct);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it("should reject product with invalid dev_status", () => {
      const invalidProduct = {
        id: "Material-8x8-V",
        name: "8x8 Void Panel",
        description: "240mm panel",
        category: "material",
        dev_status: 10, // Invalid
        base_price: 3500,
        stripe_product_id: "prod_TFqJ6019ONDct2",
        has_variants: false,
        images: ["https://cloudinary.com/image1.jpg"],
        specs: [],
      };

      const result = validateProductJson(invalidProduct);

      expect(result.success).toBe(false);
    });

    it("should reject product with negative price", () => {
      const invalidProduct = {
        id: "Material-8x8-V",
        name: "8x8 Void Panel",
        description: "240mm panel",
        category: "material",
        dev_status: 5,
        base_price: -100,
        stripe_product_id: "prod_TFqJ6019ONDct2",
        has_variants: false,
        images: ["https://cloudinary.com/image1.jpg"],
        specs: [],
      };

      const result = validateProductJson(invalidProduct);

      expect(result.success).toBe(false);
    });
  });

  describe("validateVariantAvailability", () => {
    it("should return available for unlimited variant", () => {
      const variant = createMockVariant({
        id: "Material-8x8-V-Black",
        productId: "Material-8x8-V",
        stripeProductId: "prod_material_black",
        variantValue: "BLACK",
        isLimitedEdition: false,
        maxQuantity: null,
        soldQuantity: 0,
        availableQuantity: null,
      });

      const result = validateVariantAvailability(variant);

      expect(result.isAvailable).toBe(true);
      expect(result.availableQuantity).toBeNull();
    });

    it("should return available for limited edition with stock", () => {
      const variant = createMockVariant({
        id: "Unit-8x8x8-Founder-Black",
        productId: "Unit-8x8x8-Founder",
        stripeProductId: "prod_founder_black",
        variantValue: "BLACK",
        isLimitedEdition: true,
        maxQuantity: 500,
        soldQuantity: 100,
        availableQuantity: 400,
      });

      const result = validateVariantAvailability(variant);

      expect(result.isAvailable).toBe(true);
      expect(result.availableQuantity).toBe(400);
      expect(result.maxQuantity).toBe(500);
      expect(result.soldQuantity).toBe(100);
    });

    it("should return unavailable for sold out variant", () => {
      const variant = createMockVariant({
        id: "Unit-8x8x8-Founder-Black",
        productId: "Unit-8x8x8-Founder",
        stripeProductId: "prod_founder_black",
        variantValue: "BLACK",
        isLimitedEdition: true,
        maxQuantity: 500,
        soldQuantity: 500,
        availableQuantity: 0,
        isAvailable: false,
      });

      const result = validateVariantAvailability(variant);

      expect(result.isAvailable).toBe(false);
      expect(result.availableQuantity).toBe(0);
    });

    it("should handle variant with remaining stock correctly", () => {
      const variant = createMockVariant({
        id: "Unit-8x8x8-Founder-White",
        productId: "Unit-8x8x8-Founder",
        stripeProductId: "prod_founder_white",
        variantValue: "WHITE",
        isLimitedEdition: true,
        maxQuantity: 300,
        soldQuantity: 295,
        availableQuantity: 5,
      });

      const result = validateVariantAvailability(variant);

      expect(result.isAvailable).toBe(true);
      expect(result.availableQuantity).toBe(5);
    });
  });
});
