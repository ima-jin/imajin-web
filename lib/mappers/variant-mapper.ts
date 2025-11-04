/**
 * Variant Mapper
 *
 * Transforms database variants to application variants with validation.
 * Part of the type safety layer to ensure clean separation between DB and app types.
 *
 * Note: Drizzle ORM returns camelCase property names even though DB columns are snake_case,
 * so this mapper primarily provides validation and type safety rather than case conversion.
 */

import { MediaItem } from '@/types/product';
import { logger } from '@/lib/utils/logger';

/**
 * Database variant type (from Drizzle schema - camelCase TypeScript properties)
 * Drizzle ORM returns camelCase property names, even though DB columns are snake_case
 */
export interface DbVariant {
  id: string;
  productId: string;
  stripeProductId: string;
  variantType: string;
  variantValue: string;
  priceModifier: number | null;
  wholesalePriceModifier: number | null;
  presaleDepositModifier: number | null;
  isLimitedEdition: boolean | null;
  maxQuantity: number | null;
  soldQuantity: number | null;
  availableQuantity: number | null; // Generated column
  isAvailable: boolean | null; // Generated column
  media: unknown;
  metadata: unknown;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/**
 * Application variant type (camelCase for use in app)
 */
export interface Variant {
  id: string;
  productId: string;
  stripeProductId: string;
  variantType: string;
  variantValue: string;
  priceModifier: number | null;
  wholesalePriceModifier: number | null;
  presaleDepositModifier: number | null;
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
 * Maps a single database variant to application variant format.
 *
 * @param dbVariant - Variant from database query
 * @returns Variant in application format with camelCase properties
 * @throws Error if required fields are missing
 */
export function mapDbVariantToVariant(dbVariant: DbVariant): Variant {
  // Validate required fields exist
  if (!dbVariant.id || !dbVariant.productId || !dbVariant.stripeProductId) {
    throw new Error("Missing required variant fields");
  }

  if (!dbVariant.variantType || !dbVariant.variantValue) {
    throw new Error("Missing required variant type/value fields");
  }

  if (dbVariant.priceModifier === undefined || dbVariant.soldQuantity === undefined) {
    throw new Error("Missing required numeric fields");
  }

  // Parse media JSONB field (array of MediaItem objects with full metadata)
  interface DbMediaItem {
    localPath?: string;
    local_path?: string;
    cloudinaryPublicId?: string;
    cloudinary_public_id?: string;
    type?: string;
    mimeType?: string;
    mime_type?: string;
    alt?: string;
    category?: string;
    order?: number;
    uploadedAt?: string;
    uploaded_at?: string;
  }

  const media: MediaItem[] = Array.isArray(dbVariant.media)
    ? (dbVariant.media as DbMediaItem[]).map((item: DbMediaItem) => ({
        localPath: item.localPath || item.local_path || '',
        cloudinaryPublicId: item.cloudinaryPublicId || item.cloudinary_public_id,
        type: (item.type as MediaItem['type']) || 'image',
        mimeType: item.mimeType || item.mime_type || '',
        alt: item.alt || '',
        category: (item.category as MediaItem['category']) || 'main',
        order: item.order || 0,
        uploadedAt: (item.uploadedAt || item.uploaded_at) ? new Date(item.uploadedAt || item.uploaded_at!) : undefined,
      }))
    : [];

  return {
    id: dbVariant.id,
    productId: dbVariant.productId,
    stripeProductId: dbVariant.stripeProductId,
    variantType: dbVariant.variantType,
    variantValue: dbVariant.variantValue,
    priceModifier: dbVariant.priceModifier,
    wholesalePriceModifier: dbVariant.wholesalePriceModifier,
    presaleDepositModifier: dbVariant.presaleDepositModifier,
    isLimitedEdition: dbVariant.isLimitedEdition,
    maxQuantity: dbVariant.maxQuantity,
    soldQuantity: dbVariant.soldQuantity,
    availableQuantity: dbVariant.availableQuantity,
    isAvailable: dbVariant.isAvailable,
    media,
    metadata: dbVariant.metadata,
    createdAt: dbVariant.createdAt,
    updatedAt: dbVariant.updatedAt,
  };
}

/**
 * Maps an array of database variants to application variants.
 * Handles errors gracefully - if a variant fails to map, it's skipped.
 *
 * @param dbVariants - Array of variants from database query
 * @returns Array of variants in application format
 */
export function mapDbVariantsToVariants(dbVariants: DbVariant[]): Variant[] {
  const variants: Variant[] = [];

  for (const dbVariant of dbVariants) {
    try {
      variants.push(mapDbVariantToVariant(dbVariant));
    } catch (error) {
      // Skip invalid variants and continue mapping
      logger.error('Failed to map variant', error as Error, {
        variantId: dbVariant?.id || 'unknown',
      });
      continue;
    }
  }

  return variants;
}
