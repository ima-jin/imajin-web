/**
 * Product Mapper
 *
 * Transforms database products to application products with validation.
 * Part of the type safety layer to ensure clean separation between DB and app types.
 *
 * Note: Drizzle ORM returns camelCase property names even though DB columns are snake_case,
 * so this mapper primarily provides validation and type safety rather than case conversion.
 */

import { MediaItem, SellStatus } from '@/types/product';
import { logger } from '@/lib/utils/logger';
import { parseMediaArray } from '@/lib/utils/media-parser';

/**
 * Database product type (from Drizzle schema - camelCase TypeScript properties)
 * Drizzle ORM returns camelCase property names, even though DB columns are snake_case
 */
export interface DbProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  devStatus: number;
  basePrice: number;
  isActive: boolean | null;
  requiresAssembly: boolean | null;
  hasVariants: boolean | null;
  maxQuantity: number | null;
  maxQuantityPerOrder: number | null;
  soldQuantity: number;
  availableQuantity: number | null;
  isAvailable: boolean | null;

  isLive: boolean;
  costCents: number | null;
  wholesalePriceCents: number | null;
  cogsPriceCents: number | null;
  presaleDepositPriceCents: number | null;
  sellStatus: string;
  sellStatusNote: string | null;
  lastSyncedAt: Date | null;
  media: unknown;

  // Portfolio & Featured Product fields
  showOnPortfolioPage: boolean;
  portfolioCopy: string | null;
  isFeatured: boolean;
  // Note: Hero image uses media array with category="hero"

  createdAt: Date | null;
  updatedAt: Date | null;
}

/**
 * Application product type (camelCase for use in app)
 */
export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  devStatus: number;
  basePrice: number;
  isActive: boolean | null;
  requiresAssembly: boolean | null;
  hasVariants: boolean | null;
  maxQuantity: number | null;
  maxQuantityPerOrder: number | null;
  soldQuantity: number;
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
 * Maps a single database product to application product format.
 *
 * @param dbProduct - Product from database query
 * @returns Product in application format with camelCase properties
 * @throws Error if required fields are missing
 */
export function mapDbProductToProduct(dbProduct: DbProduct): Product {
  // Validate required fields exist
  if (!dbProduct.id || !dbProduct.name || !dbProduct.category) {
    throw new Error("Missing required product fields");
  }

  if (dbProduct.devStatus === undefined || dbProduct.basePrice === undefined) {
    throw new Error("Missing required numeric fields");
  }

  // Parse media JSONB field (array of MediaItem objects with full metadata)
  const media = parseMediaArray(dbProduct.media);

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description,
    category: dbProduct.category,
    devStatus: dbProduct.devStatus,
    basePrice: dbProduct.basePrice,
    isActive: dbProduct.isActive,
    requiresAssembly: dbProduct.requiresAssembly,
    hasVariants: dbProduct.hasVariants,
    maxQuantity: dbProduct.maxQuantity,
    maxQuantityPerOrder: dbProduct.maxQuantityPerOrder,
    soldQuantity: dbProduct.soldQuantity,
    availableQuantity: dbProduct.availableQuantity,
    isAvailable: dbProduct.isAvailable,

    isLive: dbProduct.isLive,
    costCents: dbProduct.costCents ?? undefined,
    wholesalePriceCents: dbProduct.wholesalePriceCents ?? undefined,
    cogsPriceCents: dbProduct.cogsPriceCents ?? undefined,
    presaleDepositPriceCents: dbProduct.presaleDepositPriceCents ?? undefined,
    sellStatus: dbProduct.sellStatus as SellStatus,
    sellStatusNote: dbProduct.sellStatusNote ?? undefined,
    lastSyncedAt: dbProduct.lastSyncedAt ?? undefined,
    media,

    // Portfolio & Featured Product fields
    showOnPortfolioPage: dbProduct.showOnPortfolioPage,
    portfolioCopy: dbProduct.portfolioCopy,
    isFeatured: dbProduct.isFeatured,
    // Note: Hero image included in media array with category="hero"

    createdAt: dbProduct.createdAt,
    updatedAt: dbProduct.updatedAt,
  };
}

/**
 * Maps an array of database products to application products.
 * Handles errors gracefully - if a product fails to map, it's skipped.
 *
 * @param dbProducts - Array of products from database query
 * @returns Array of products in application format
 */
export function mapDbProductsToProducts(dbProducts: DbProduct[]): Product[] {
  const products: Product[] = [];

  for (const dbProduct of dbProducts) {
    try {
      products.push(mapDbProductToProduct(dbProduct));
    } catch (error) {
      // Skip invalid products and continue mapping
      logger.error('Failed to map product', error as Error, {
        productId: dbProduct?.id || 'unknown',
      });
      continue;
    }
  }

  return products;
}
