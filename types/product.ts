/**
 * Product Type Definitions
 *
 * These types define the structure of products as they appear in the application,
 * after being loaded from the database. They map to the database schema in db/schema.ts
 */

/**
 * Product category enum
 */
export type ProductCategory = "material" | "connector" | "control" | "diffuser" | "kit" | "interface";

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
  basePrice: number; // Price in cents
  isActive: boolean | null;
  requiresAssembly: boolean | null;
  hasVariants: boolean | null;
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
  stripeProductId: string;
  variantType: string;
  variantValue: string;
  priceModifier: number | null; // Price difference in cents
  isLimitedEdition: boolean | null;
  maxQuantity: number | null;
  soldQuantity: number | null;
  availableQuantity: number | null; // Auto-calculated
  isAvailable: boolean | null; // Auto-calculated
  metadata: unknown; // JSONB field from DB
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
