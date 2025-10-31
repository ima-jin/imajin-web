import { z } from "zod";

/**
 * Media Item Schema
 * Defines media files (images, videos, PDFs) for products
 */
export const MediaItemSchema = z.object({
  local_path: z.string(),
  cloudinary_public_id: z.string().optional(),
  type: z.enum(["image", "video", "pdf", "other"]),
  mime_type: z.string(),
  alt: z.string(),
  category: z.enum(["main", "detail", "lifestyle", "dimension", "spec", "hero"]), // Phase 2.4.7: Added "hero"
  order: z.number().int().positive(),
  uploaded_at: z.string().datetime().optional(),
  deleted: z.boolean().optional(),
  deleted_at: z.string().datetime().optional(),
});

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
  category: z.enum(["material", "connector", "control", "diffuser", "kit", "unit", "interface", "accessory"]),
  dev_status: z.number().int().min(0).max(5),
  base_price: z.number().int().positive(),
  stripe_product_id: z.string().min(1).optional(),
  has_variants: z.boolean(),
  requires_assembly: z.boolean().optional(),
  max_quantity: z.number().int().positive().nullable().optional(),

  is_live: z.boolean().default(false),
  cost_cents: z.number().int().positive().optional(),
  wholesale_price_cents: z.number().int().positive().optional(),
  sell_status: z.enum(["for-sale", "pre-order", "sold-out", "internal"]).default("internal"),
  sell_status_note: z.string().optional(),
  last_synced_at: z.string().datetime().optional(),
  media: z.array(MediaItemSchema).default([]),

  // Portfolio & Featured Product fields (Phase 2.4.7)
  show_on_portfolio_page: z.boolean().default(false),
  portfolio_copy: z.string().max(2000).nullable().optional(),
  is_featured: z.boolean().default(false),
  hero_image: z.string().nullable().optional(),

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
  stripe_product_id: z.string().min(1).optional(),
  variant_type: z.string().min(1),
  variant_value: z.string().min(1),
  price_modifier: z.number().int().optional(),
  is_limited_edition: z.boolean(),
  max_quantity: z.number().int().positive().optional(),
  media: z.array(MediaItemSchema).default([]),
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
export type MediaItem = z.infer<typeof MediaItemSchema>;
export type ProductConfig = z.infer<typeof ProductConfigSchema>;
export type VariantConfig = z.infer<typeof VariantConfigSchema>;
export type ProductDependency = z.infer<typeof ProductDependencySchema>;
export type ProductSpec = z.infer<typeof ProductSpecSchema>;
export type ProductsJson = z.infer<typeof ProductsJsonSchema>;
