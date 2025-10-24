/**
 * Variant Mapper
 *
 * Transforms database variants to application variants with validation.
 * Part of the type safety layer to ensure clean separation between DB and app types.
 *
 * Note: Drizzle ORM returns camelCase property names even though DB columns are snake_case,
 * so this mapper primarily provides validation and type safety rather than case conversion.
 */

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
  isLimitedEdition: boolean | null;
  maxQuantity: number | null;
  soldQuantity: number | null;
  availableQuantity: number | null; // Generated column
  isAvailable: boolean | null; // Generated column
  metadata: unknown; // JSONB field
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
  isLimitedEdition: boolean | null;
  maxQuantity: number | null;
  soldQuantity: number | null;
  availableQuantity: number | null;
  isAvailable: boolean | null;
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

  return {
    id: dbVariant.id,
    productId: dbVariant.productId,
    stripeProductId: dbVariant.stripeProductId,
    variantType: dbVariant.variantType,
    variantValue: dbVariant.variantValue,
    priceModifier: dbVariant.priceModifier,
    isLimitedEdition: dbVariant.isLimitedEdition,
    maxQuantity: dbVariant.maxQuantity,
    soldQuantity: dbVariant.soldQuantity,
    availableQuantity: dbVariant.availableQuantity,
    isAvailable: dbVariant.isAvailable,
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
      console.error(`Failed to map variant ${dbVariant?.id || "unknown"}:`, error);
      continue;
    }
  }

  return variants;
}
