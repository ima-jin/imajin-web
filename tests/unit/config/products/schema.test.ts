import { describe, it, expect } from "vitest";
import {
  ProductConfigSchema,
  VariantConfigSchema,
  ProductDependencySchema,
  ProductSpecSchema,
} from "@/config/schema";

describe("ProductConfigSchema", () => {
  it("should validate a valid product configuration", () => {
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

    const result = ProductConfigSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it("should reject product with invalid dev_status", () => {
    const invalidProduct = {
      id: "Material-8x8-V",
      name: "8x8 Void Panel",
      description: "240mm, 8×8 prototype PCB from 2024",
      category: "material",
      dev_status: 6, // Invalid: should be 0-5
      base_price: 3500,
      stripe_product_id: "prod_TFqJ6019ONDct2",
      has_variants: false,
      images: ["https://cloudinary.com/image1.jpg"],
      specs: [],
    };

    const result = ProductConfigSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  it("should reject product with invalid category", () => {
    const invalidProduct = {
      id: "Material-8x8-V",
      name: "8x8 Void Panel",
      description: "240mm, 8×8 prototype PCB from 2024",
      category: "invalid_category",
      dev_status: 5,
      base_price: 3500,
      stripe_product_id: "prod_TFqJ6019ONDct2",
      has_variants: false,
      images: ["https://cloudinary.com/image1.jpg"],
      specs: [],
    };

    const result = ProductConfigSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  it("should reject product with negative price", () => {
    const invalidProduct = {
      id: "Material-8x8-V",
      name: "8x8 Void Panel",
      description: "240mm, 8×8 prototype PCB from 2024",
      category: "material",
      dev_status: 5,
      base_price: -100,
      stripe_product_id: "prod_TFqJ6019ONDct2",
      has_variants: false,
      images: ["https://cloudinary.com/image1.jpg"],
      specs: [],
    };

    const result = ProductConfigSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  it("should accept product with optional long_description", () => {
    const productWithLongDesc = {
      id: "Material-8x8-V",
      name: "8x8 Void Panel",
      description: "Short description",
      long_description: "This is a much longer description with more details",
      category: "material",
      dev_status: 5,
      base_price: 3500,
      stripe_product_id: "prod_TFqJ6019ONDct2",
      has_variants: false,
      images: ["https://cloudinary.com/image1.jpg"],
      specs: [],
    };

    const result = ProductConfigSchema.safeParse(productWithLongDesc);
    expect(result.success).toBe(true);
  });

  it("should accept product with optional metadata", () => {
    const productWithMetadata = {
      id: "Material-8x8-V",
      name: "8x8 Void Panel",
      description: "240mm, 8×8 prototype PCB from 2024",
      category: "material",
      dev_status: 5,
      base_price: 3500,
      stripe_product_id: "prod_TFqJ6019ONDct2",
      has_variants: false,
      images: ["https://cloudinary.com/image1.jpg"],
      specs: [],
      metadata: {
        year_introduced: 2024,
        generation: 2,
        weight_grams: 72,
      },
    };

    const result = ProductConfigSchema.safeParse(productWithMetadata);
    expect(result.success).toBe(true);
  });
});

describe("VariantConfigSchema", () => {
  it("should validate a valid variant configuration", () => {
    const validVariant = {
      id: "Unit-8x8x8-Founder-Black",
      product_id: "Unit-8x8x8-Founder",
      stripe_product_id: "prod_stripe_founder_black",
      variant_type: "color",
      variant_value: "BLACK",
      is_limited_edition: true,
      max_quantity: 500,
    };

    const result = VariantConfigSchema.safeParse(validVariant);
    expect(result.success).toBe(true);
  });

  it("should accept variant with optional price_modifier", () => {
    const variantWithModifier = {
      id: "Unit-8x8x8-Founder-Black",
      product_id: "Unit-8x8x8-Founder",
      stripe_product_id: "prod_stripe_founder_black",
      variant_type: "color",
      variant_value: "BLACK",
      price_modifier: 1000,
      is_limited_edition: true,
      max_quantity: 500,
    };

    const result = VariantConfigSchema.safeParse(variantWithModifier);
    expect(result.success).toBe(true);
  });

  it("should accept variant without max_quantity (unlimited)", () => {
    const unlimitedVariant = {
      id: "Material-8x8-V-Black",
      product_id: "Material-8x8-V",
      stripe_product_id: "prod_material_black",
      variant_type: "color",
      variant_value: "BLACK",
      is_limited_edition: false,
    };

    const result = VariantConfigSchema.safeParse(unlimitedVariant);
    expect(result.success).toBe(true);
  });

  it("should accept variant with custom images", () => {
    const variantWithImages = {
      id: "Unit-8x8x8-Founder-Black",
      product_id: "Unit-8x8x8-Founder",
      stripe_product_id: "prod_stripe_founder_black",
      variant_type: "color",
      variant_value: "BLACK",
      is_limited_edition: true,
      max_quantity: 500,
      images: ["https://cloudinary.com/black1.jpg", "https://cloudinary.com/black2.jpg"],
    };

    const result = VariantConfigSchema.safeParse(variantWithImages);
    expect(result.success).toBe(true);
  });
});

describe("ProductDependencySchema", () => {
  it("should validate a valid dependency configuration", () => {
    const validDependency = {
      product_id: "Connect-4x31.6-5v",
      depends_on_product_id: "Material-8x8-V",
      dependency_type: "requires",
      message: "Spine connectors require Material-8x8-V panels",
    };

    const result = ProductDependencySchema.safeParse(validDependency);
    expect(result.success).toBe(true);
  });

  it("should accept all valid dependency types", () => {
    const types = ["requires", "suggests", "incompatible", "voltage_match"];

    types.forEach((type) => {
      const dependency = {
        product_id: "Product-A",
        depends_on_product_id: "Product-B",
        dependency_type: type,
        message: `Test message for ${type}`,
      };

      const result = ProductDependencySchema.safeParse(dependency);
      expect(result.success).toBe(true);
    });
  });

  it("should reject invalid dependency type", () => {
    const invalidDependency = {
      product_id: "Product-A",
      depends_on_product_id: "Product-B",
      dependency_type: "invalid_type",
      message: "Test message",
    };

    const result = ProductDependencySchema.safeParse(invalidDependency);
    expect(result.success).toBe(false);
  });

  it("should accept dependency with metadata", () => {
    const dependencyWithMetadata = {
      product_id: "Material-8x8-V",
      depends_on_product_id: "Diffuse-12-C",
      dependency_type: "suggests",
      message: "Recommended: 64 diffusion caps per panel",
      metadata: {
        quantity_ratio: 64,
        alternative_products: ["Diffuse-12-S"],
      },
    };

    const result = ProductDependencySchema.safeParse(dependencyWithMetadata);
    expect(result.success).toBe(true);
  });
});

describe("ProductSpecSchema", () => {
  it("should validate a valid spec configuration", () => {
    const validSpec = {
      key: "voltage",
      value: "5",
      unit: "v",
      display_order: 1,
    };

    const result = ProductSpecSchema.safeParse(validSpec);
    expect(result.success).toBe(true);
  });

  it("should accept spec without unit", () => {
    const specWithoutUnit = {
      key: "led_type",
      value: "WS2812B",
      display_order: 4,
    };

    const result = ProductSpecSchema.safeParse(specWithoutUnit);
    expect(result.success).toBe(true);
  });

  it("should reject spec with negative display_order", () => {
    const invalidSpec = {
      key: "voltage",
      value: "5",
      unit: "v",
      display_order: -1,
    };

    const result = ProductSpecSchema.safeParse(invalidSpec);
    expect(result.success).toBe(false);
  });
});
