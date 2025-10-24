import { z } from "zod";

/**
 * Product Spec Schema
 * Defines technical specifications for products
 */
export const ProductSpecSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  unit: z.string().optional(),
  display_order: z.number().int().nonnegative(),
});

/**
 * Product Config Schema
 * Main schema for product configuration
 */
export const ProductConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  long_description: z.string().optional(),
  category: z.enum(["material", "connector", "control", "diffuser", "kit", "interface"]),
  dev_status: z.number().int().min(0).max(5),
  base_price: z.number().int().positive(),
  stripe_product_id: z.string().min(1),
  has_variants: z.boolean(),
  requires_assembly: z.boolean().optional(),
  images: z.array(z.string()),
  specs: z.array(ProductSpecSchema),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Variant Config Schema
 * Defines product variants (colors, sizes, etc.)
 */
export const VariantConfigSchema = z.object({
  id: z.string().min(1),
  product_id: z.string().min(1),
  stripe_product_id: z.string().min(1),
  variant_type: z.string().min(1),
  variant_value: z.string().min(1),
  price_modifier: z.number().int().optional(),
  is_limited_edition: z.boolean(),
  max_quantity: z.number().int().positive().optional(),
  images: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Product Dependency Schema
 * Defines relationships and compatibility rules between products
 */
export const ProductDependencySchema = z.object({
  product_id: z.string().min(1),
  depends_on_product_id: z.string().min(1),
  dependency_type: z.enum(["requires", "suggests", "incompatible", "voltage_match"]),
  message: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Products JSON Schema
 * Schema for the single products.json file containing all products, variants, and dependencies
 */
export const ProductsJsonSchema = z.object({
  version: z.string().optional(),
  updated: z.string().optional(),
  products: z.array(ProductConfigSchema),
  variants: z.array(VariantConfigSchema).optional(),
  dependencies: z.array(ProductDependencySchema).optional(),
});

// Export types inferred from schemas
export type ProductConfig = z.infer<typeof ProductConfigSchema>;
export type VariantConfig = z.infer<typeof VariantConfigSchema>;
export type ProductDependency = z.infer<typeof ProductDependencySchema>;
export type ProductSpec = z.infer<typeof ProductSpecSchema>;
export type ProductsJson = z.infer<typeof ProductsJsonSchema>;
