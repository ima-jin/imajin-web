/**
 * Product Type Definitions
 *
 * These types define the structure of products as they appear in the application,
 * after being loaded from the database. They map to the database schema in db/schema.ts
 */

import { z } from 'zod';

/**
 * Product category enum
 */
export type ProductCategory = "material" | "connector" | "control" | "diffuser" | "kit" | "interface" | "unit" | "accessory";

/**
 * Development status (0-5)
 * Only products with dev_status = 5 are shown on public site
 */
export type DevStatus = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Dependency type enum
 */
export type DependencyType = "requires" | "suggests" | "incompatible" | "voltage_match";

/**
 * Sell status enum
 */
export type SellStatus = "for-sale" | "pre-order" | "pre-sale" | "sold-out" | "internal";

/**
 * Media Item
 * Represents a media file (image, video, PDF) associated with a product
 * Stored as JSONB in database, includes all metadata needed for SEO, display, etc.
 */
export interface MediaItem {
  localPath: string; // Path in config/content/media/
  cloudinaryPublicId?: string; // Set after upload
  type: "image" | "video" | "pdf" | "other";
  mimeType: string; // e.g., "image/jpeg"
  alt: string; // Alt text for accessibility/SEO
  category: "main" | "detail" | "lifestyle" | "dimension" | "spec" | "hero"; // Includes "hero" for featured products
  order: number; // Display order
  uploadedAt?: Date; // When uploaded to Cloudinary
  deleted?: boolean; // Soft deletion flag
  deletedAt?: Date; // When media was soft-deleted
}

/**
 * Product Spec
 * Technical specification for a product
 */
export interface ProductSpec {
  id: number;
  productId: string;
  specKey: string;
  specValue: string;
  specUnit: string | null;
  displayOrder: number | null;
}

/**
 * Product
 * Core product information
 */
export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string; // ProductCategory - stored as string in DB
  devStatus: number; // DevStatus - stored as number in DB
  basePriceCents: number | null; // Price in cents
  isActive: boolean | null;
  requiresAssembly: boolean | null;
  hasVariants: boolean | null;

  // Inventory tracking (product level)
  maxQuantity: number | null;
  soldQuantity: number;
  maxQuantityPerOrder: number | null;
  availableQuantity: number | null;
  isAvailable: boolean | null;

  isLive: boolean;
  costCents?: number;
  wholesalePriceCents?: number;
  cogsPriceCents?: number;
  presaleDepositPriceCents?: number;
  sellStatus: SellStatus;
  sellStatusNote?: string;
  lastSyncedAt?: Date;
  media: MediaItem[];

  // Portfolio & Featured Product fields
  showOnPortfolioPage: boolean;
  portfolioCopy: string | null;
  isFeatured: boolean;
  // Note: Hero image uses media array with category="hero"

  createdAt: Date | null;
  updatedAt: Date | null;
}

/**
 * Product with specs
 * Product including its technical specifications
 */
export interface ProductWithSpecs extends Product {
  specs: ProductSpec[];
}

/**
 * Variant
 * Product variant (color, size, etc.)
 */
export interface Variant {
  id: string;
  productId: string;
  stripeProductId: string; // Stripe Product ID (parent product for variant)
  stripePriceId?: string; // Stripe Price ID (for variant-specific pricing)
  variantType: string;
  variantValue: string;
  priceModifier: number | null; // Price difference in cents
  wholesalePriceModifier: number | null; // Adjusts wholesalePrice
  presaleDepositModifier: number | null; // Adjusts presaleDepositPriceCents
  isLimitedEdition: boolean | null;
  maxQuantity: number | null;
  soldQuantity: number | null;
  availableQuantity: number | null;
  isAvailable: boolean | null;
  media: MediaItem[];
  metadata: unknown;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/**
 * Product with variants
 * Product including all its variants
 */
export interface ProductWithVariants extends ProductWithSpecs {
  variants: Variant[];
}

/**
 * Product Dependency
 * Relationship/compatibility rule between products
 */
export interface ProductDependency {
  id: number;
  productId: string;
  dependsOnProductId: string;
  dependencyType: DependencyType;
  message: string | null;
  metadata: unknown; // JSONB field from DB
}

/**
 * Product with dependencies
 * Product including its dependencies and specifications
 */
export interface ProductWithDependencies extends ProductWithSpecs {
  dependencies: ProductDependency[];
}

/**
 * Complete Product
 * Product with all related data (specs, variants, dependencies)
 */
export interface CompleteProduct extends Product {
  specs: ProductSpec[];
  variants: Variant[];
  dependencies: ProductDependency[];
}

/**
 * Product Filter Options
 * Options for filtering products
 */
export interface ProductFilters {
  category?: ProductCategory;
  devStatus?: DevStatus;
  isActive?: boolean;
  isLive?: boolean;
  hasVariants?: boolean;
}

/**
 * Variant Availability Check Result
 */
export interface VariantAvailability {
  variantId: string;
  isAvailable: boolean;
  availableQuantity: number | null;
  maxQuantity: number | null;
  soldQuantity: number;
}

/**
 * Zod Schemas for Runtime Validation
 */

export const ProductCategorySchema = z.enum(['material', 'connector', 'control', 'diffuser', 'kit', 'interface']);

export const MediaItemSchema = z.object({
  localPath: z.string(),
  cloudinaryPublicId: z.string().optional(),
  type: z.enum(['image', 'video', 'pdf', 'other']),
  mimeType: z.string(),
  alt: z.string(),
  category: z.enum(['main', 'detail', 'lifestyle', 'dimension', 'spec', 'hero']), // Includes "hero" for featured products
  order: z.number(),
  uploadedAt: z.coerce.date().optional(),
  deleted: z.boolean().optional(),
  deletedAt: z.coerce.date().optional(),
});

export const ProductSpecSchema = z.object({
  id: z.number(),
  productId: z.string(),
  specKey: z.string(),
  specValue: z.string(),
  specUnit: z.string().nullable(),
  displayOrder: z.number().nullable(),
});

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  devStatus: z.number(),
  basePriceCents: z.number(),
  isActive: z.boolean().nullable(),
  requiresAssembly: z.boolean().nullable(),
  hasVariants: z.boolean().nullable(),

  // Inventory tracking (product level)
  maxQuantity: z.number().nullable(),
  maxQuantityPerOrder: z.number().nullable(),
  soldQuantity: z.number(),
  availableQuantity: z.number().nullable(),
  isAvailable: z.boolean().nullable(),

  // Product visibility and sync tracking
  isLive: z.boolean(),
  costCents: z.number().optional(),
  wholesalePriceCents: z.number().optional(),
  cogsPriceCents: z.number().optional(),
  presaleDepositPriceCents: z.number().optional(),
  sellStatus: z.enum(['for-sale', 'pre-order', 'pre-sale', 'sold-out', 'internal']),
  sellStatusNote: z.string().optional(),
  lastSyncedAt: z.coerce.date().optional(),
  media: z.array(MediaItemSchema),

  // Portfolio & Featured Product fields
  showOnPortfolioPage: z.boolean(),
  portfolioCopy: z.string().nullable(),
  isFeatured: z.boolean(),
  // Note: Hero image uses media array with category="hero"

  createdAt: z.coerce.date().nullable(),
  updatedAt: z.coerce.date().nullable(),
});

export const VariantSchema = z.object({
  id: z.string(),
  productId: z.string(),
  stripeProductId: z.string(),
  stripePriceId: z.string().optional(),
  variantType: z.string(),
  variantValue: z.string(),
  priceModifier: z.number().nullable(),
  wholesalePriceModifier: z.number().nullable(),
  presaleDepositModifier: z.number().nullable(),
  isLimitedEdition: z.boolean().nullable(),
  maxQuantity: z.number().nullable(),
  soldQuantity: z.number().nullable(),
  availableQuantity: z.number().nullable(),
  isAvailable: z.boolean().nullable(),
  media: z.array(MediaItemSchema),
  metadata: z.unknown(),
  createdAt: z.coerce.date().nullable(),
  updatedAt: z.coerce.date().nullable(),
});

export const ProductWithSpecsSchema = ProductSchema.extend({
  specs: z.array(ProductSpecSchema),
});

export const ProductWithVariantsSchema = ProductWithSpecsSchema.extend({
  variants: z.array(VariantSchema),
});
