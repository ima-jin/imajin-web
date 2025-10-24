/**
 * Product Mapper
 *
 * Transforms database products to application products with validation.
 * Part of the type safety layer to ensure clean separation between DB and app types.
 *
 * Note: Drizzle ORM returns camelCase property names even though DB columns are snake_case,
 * so this mapper primarily provides validation and type safety rather than case conversion.
 */

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
      console.error(`Failed to map product ${dbProduct?.id || "unknown"}:`, error);
      continue;
    }
  }

  return products;
}
