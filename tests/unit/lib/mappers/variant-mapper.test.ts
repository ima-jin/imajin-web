import { describe, it, expect } from "vitest";
import {
  mapDbVariantToVariant,
  mapDbVariantsToVariants,
  type DbVariant,
} from "@/lib/mappers/variant-mapper";

describe("mapDbVariantToVariant", () => {
  it("maps valid DB variant to application variant", () => {
    const now = new Date();
    const dbVariant = {
      id: "Founder-Kit-BLACK",
      productId: "Founder-Kit",
      stripeProductId: "prod_xxx",
      variantType: "color",
      variantValue: "BLACK",
      priceModifier: 0,
      isLimitedEdition: true,
      maxQuantity: 500,
      soldQuantity: 50,
      availableQuantity: 450,
      isAvailable: true,
      metadata: null,
      createdAt: now,
      updatedAt: now,
    };

    const result = mapDbVariantToVariant(dbVariant);

    expect(result).toEqual({
      id: "Founder-Kit-BLACK",
      productId: "Founder-Kit",
      stripeProductId: "prod_xxx",
      variantType: "color",
      variantValue: "BLACK",
      priceModifier: 0,
      isLimitedEdition: true,
      maxQuantity: 500,
      soldQuantity: 50,
      availableQuantity: 450,
      isAvailable: true,
      metadata: null,
      createdAt: now,
      updatedAt: now,
    });
  });

  it("handles unlimited quantity variant (null maxQuantity)", () => {
    const now = new Date();
    const dbVariant = {
      id: "Material-8x8-V-WHITE",
      productId: "Material-8x8-V",
      stripeProductId: "prod_yyy",
      variantType: "color",
      variantValue: "WHITE",
      priceModifier: 0,
      isLimitedEdition: false,
      maxQuantity: null,
      soldQuantity: 0,
      availableQuantity: null, // NULL when unlimited
      isAvailable: true,
      metadata: null,
      createdAt: now,
      updatedAt: now,
    };

    const result = mapDbVariantToVariant(dbVariant);

    expect(result.maxQuantity).toBeNull();
    expect(result.availableQuantity).toBeNull();
    expect(result.isAvailable).toBe(true);
  });

  it("handles variant with price modifier", () => {
    const now = new Date();
    const dbVariant = {
      id: "variant-1",
      productId: "product-1",
      stripeProductId: "prod_zzz",
      variantType: "voltage",
      variantValue: "24v",
      priceModifier: 1500, // $15 more expensive
      isLimitedEdition: false,
      maxQuantity: null,
      soldQuantity: 0,
      availableQuantity: null,
      isAvailable: true,
      metadata: null,
      createdAt: now,
      updatedAt: now,
    };

    const result = mapDbVariantToVariant(dbVariant);

    expect(result.priceModifier).toBe(1500);
  });

  it("handles sold out variant (isAvailable = false)", () => {
    const now = new Date();
    const dbVariant = {
      id: "Founder-Kit-RED",
      productId: "Founder-Kit",
      stripeProductId: "prod_aaa",
      variantType: "color",
      variantValue: "RED",
      priceModifier: 0,
      isLimitedEdition: true,
      maxQuantity: 200,
      soldQuantity: 200,
      availableQuantity: 0,
      isAvailable: false,
      metadata: null,
      createdAt: now,
      updatedAt: now,
    };

    const result = mapDbVariantToVariant(dbVariant);

    expect(result.availableQuantity).toBe(0);
    expect(result.isAvailable).toBe(false);
  });
});

describe("mapDbVariantsToVariants", () => {
  it("maps array of valid variants", () => {
    const now = new Date();
    const dbVariants = [
      {
        id: "variant-1",
        productId: "product-1",
        stripeProductId: "prod_1",
        variantType: "color",
        variantValue: "BLACK",
        priceModifier: 0,
        isLimitedEdition: true,
        maxQuantity: 100,
        soldQuantity: 10,
        availableQuantity: 90,
        isAvailable: true,
        metadata: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "variant-2",
        productId: "product-1",
        stripeProductId: "prod_2",
        variantType: "color",
        variantValue: "WHITE",
        priceModifier: 0,
        isLimitedEdition: true,
        maxQuantity: 50,
        soldQuantity: 5,
        availableQuantity: 45,
        isAvailable: true,
        metadata: null,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const result = mapDbVariantsToVariants(dbVariants);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("variant-1");
    expect(result[0].availableQuantity).toBe(90);
    expect(result[1].id).toBe("variant-2");
    expect(result[1].availableQuantity).toBe(45);
  });

  it("returns empty array for empty input", () => {
    const result = mapDbVariantsToVariants([]);
    expect(result).toEqual([]);
  });

  it("handles errors gracefully and continues mapping", () => {
    const now = new Date();
    const dbVariants = [
      {
        id: "valid-variant",
        productId: "product-1",
        stripeProductId: "prod_valid",
        variantType: "color",
        variantValue: "BLACK",
        priceModifier: 0,
        isLimitedEdition: false,
        maxQuantity: null,
        soldQuantity: 0,
        availableQuantity: null,
        isAvailable: true,
        metadata: null,
        createdAt: now,
        updatedAt: now,
      },
      // Invalid variant missing required fields - will be skipped
      {
        id: "invalid-variant",
      } as DbVariant,
    ];

    const result = mapDbVariantsToVariants(dbVariants);

    // Should only return the valid variant
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("valid-variant");
  });
});
