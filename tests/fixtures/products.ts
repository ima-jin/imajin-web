/**
 * Consolidated Product Test Fixtures
 * Provides type-safe fixture factories for products, variants, and database models
 *
 * Usage:
 * - Use createMockProduct() for Product type (app layer)
 * - Use createMockDbProduct() for DbProduct type (database layer)
 * - Use createFeaturedProduct() for featured/homepage products
 * - Use createPortfolioProduct() for portfolio page products
 */

import { Product } from '@/types/product';

// ==============================================================================
// BASE DEFAULTS
// ==============================================================================

/**
 * Base product defaults - shared across all fixture types
 */
const baseProductDefaults = {
  category: 'material' as const,
  devStatus: 5,
  isActive: true,
  requiresAssembly: false,
  hasVariants: false,
  maxQuantity: null,
  soldQuantity: 0,
  availableQuantity: null,
  isAvailable: true,
  isLive: true,
  costCents: null,
  wholesalePriceCents: null,
  cogsPrice: null,
  presaleDepositPrice: null,
  sellStatus: 'for-sale' as const,
  sellStatusNote: null,
  lastSyncedAt: null,
  media: [],
  showOnPortfolioPage: false,
  portfolioCopy: null,
  isFeatured: false,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

/**
 * Base database product defaults (nullable instead of undefined)
 */
const baseDbProductDefaults = {
  ...baseProductDefaults,
  costCents: null,
  wholesalePriceCents: null,
  cogsPrice: null,
  presaleDepositPrice: null,
  sellStatusNote: null,
  lastSyncedAt: null,
};

// ==============================================================================
// PRODUCT FIXTURES (Application Layer)
// ==============================================================================

/**
 * Create a mock Product (app layer type)
 *
 * @example
 * const product = createMockProduct({
 *   id: 'prod_123',
 *   name: 'Test Product',
 *   basePrice: 10000,
 * });
 */
export function createMockProduct(overrides: Partial<Product> & {
  id: string;
  name: string;
  basePrice: number;
}): Product {
  return {
    description: 'Test description',
    ...baseProductDefaults,
    ...overrides,
  } as Product;
}

/**
 * Create a featured product for homepage testing
 * Sets isFeatured: true automatically
 *
 * @example
 * const featured = createFeaturedProduct({
 *   id: 'prod_featured',
 *   name: 'Featured Product',
 *   basePrice: 15000,
 *   media: [{ category: 'hero', url: '...' }]
 * });
 */
export function createFeaturedProduct(overrides: Partial<Product> & {
  id: string;
  name: string;
  basePrice: number;
}): Product {
  return {
    description: 'Featured product description',
    ...baseProductDefaults,
    isFeatured: true,
    ...overrides,
  } as Product;
}

/**
 * Create a portfolio product for portfolio page testing
 * Sets showOnPortfolioPage: true automatically
 *
 * @example
 * const portfolio = createPortfolioProduct({
 *   id: 'prod_portfolio',
 *   name: 'Portfolio Installation',
 *   basePrice: 20000,
 *   portfolioCopy: '## Featured Installation\n\nThis was showcased at...',
 * });
 */
export function createPortfolioProduct(overrides: Partial<Product> & {
  id: string;
  name: string;
  basePrice: number;
  portfolioCopy: string;
}): Product {
  return {
    description: 'Portfolio product description',
    ...baseProductDefaults,
    showOnPortfolioPage: true,
    ...overrides,
  } as Product;
}

// ==============================================================================
// DATABASE FIXTURES (Data Layer)
// ==============================================================================

/**
 * Database product type (uses null instead of undefined)
 */
export interface DbProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  devStatus: number;
  basePrice: number;
  isActive: boolean;
  requiresAssembly: boolean;
  hasVariants: boolean;
  maxQuantity: number | null;
  soldQuantity: number;
  availableQuantity: number | null;
  isAvailable: boolean;
  isLive: boolean;
  costCents: number | null;
  wholesalePriceCents: number | null;
  cogsPrice: number | null;
  presaleDepositPrice: number | null;
  sellStatus: string;
  sellStatusNote: string | null;
  lastSyncedAt: Date | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  media: any[];
  showOnPortfolioPage: boolean;
  portfolioCopy: string | null;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a mock DbProduct (database layer type)
 *
 * @example
 * const dbProduct = createMockDbProduct({
 *   id: 'prod_123',
 *   name: 'Test Product',
 *   basePrice: 10000,
 * });
 */
export function createMockDbProduct(overrides: Partial<DbProduct> & {
  id: string;
  name: string;
  basePrice?: number;
}): DbProduct {
  return {
    description: 'Test description',
    basePrice: 10000, // Default price if not specified
    ...baseDbProductDefaults,
    ...overrides,
  } as DbProduct;
}

// ==============================================================================
// VARIANT FIXTURES
// ==============================================================================

/**
 * Database variant type
 */
export interface DbVariant {
  id: string;
  productId: string;
  stripeProductId: string;
  variantType: string;
  variantValue: string;
  priceModifier: number;
  wholesalePriceModifier: number;
  presaleDepositModifier: number;
  isLimitedEdition: boolean;
  maxQuantity: number | null;
  soldQuantity: number;
  availableQuantity: number | null;
  isAvailable: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  media: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a mock DbVariant
 *
 * @example
 * const variant = createMockDbVariant({
 *   id: 'var_black',
 *   productId: 'prod_123',
 *   variantValue: 'BLACK',
 * });
 */
export function createMockDbVariant(overrides: Partial<DbVariant> & {
  id: string;
  productId: string;
}): DbVariant {
  return {
    stripeProductId: 'prod_test123',
    variantType: 'color',
    variantValue: 'BLACK',
    priceModifier: 0,
    wholesalePriceModifier: 0,
    presaleDepositModifier: 0,
    isLimitedEdition: false,
    maxQuantity: null,
    soldQuantity: 0,
    availableQuantity: null,
    isAvailable: true,
    media: [],
    metadata: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

// ==============================================================================
// JSON CONFIG FIXTURES (for sync script tests)
// ==============================================================================

/**
 * Create a test ProductConfig (matches products.json schema with snake_case)
 * Use this for testing sync scripts and JSON validation
 *
 * @example
 * const productConfig = createTestProductConfig({
 *   id: 'test-product',
 *   name: 'Test Product',
 *   base_price: 5000,
 * });
 */
export function createTestProductConfig(overrides: Partial<{
  id: string;
  name: string;
  description: string;
  category: string;
  dev_status: number;
  base_price: number;
  has_variants: boolean;
  requires_assembly: boolean;
  is_live: boolean;
  sell_status: string;
  sell_status_note?: string;
  show_on_portfolio_page: boolean;
  portfolio_copy: string | null;
  is_featured: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  media: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  specs: any[];
  stripe_product_id?: string;
  stripe_price_id?: string;
  last_synced_at?: string;
  max_quantity?: number | null;
  cost_cents?: number;
  wholesale_price_cents?: number;
  cogs_price?: number;
  presale_deposit_price?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}> & { id: string; name: string }): any {
  return {
    id: overrides.id,
    name: overrides.name,
    description: overrides.description ?? 'Test description',
    category: overrides.category ?? 'material',
    dev_status: overrides.dev_status ?? 5,
    base_price: overrides.base_price ?? 5000,
    has_variants: overrides.has_variants ?? false,
    requires_assembly: overrides.requires_assembly ?? false,
    is_live: overrides.is_live ?? true,
    sell_status: overrides.sell_status ?? 'for-sale',
    ...(overrides.sell_status_note && { sell_status_note: overrides.sell_status_note }),
    show_on_portfolio_page: overrides.show_on_portfolio_page ?? false,
    portfolio_copy: overrides.portfolio_copy ?? null,
    is_featured: overrides.is_featured ?? false,
    media: overrides.media ?? [],
    specs: overrides.specs ?? [],
    ...(overrides.stripe_product_id && { stripe_product_id: overrides.stripe_product_id }),
    ...(overrides.stripe_price_id && { stripe_price_id: overrides.stripe_price_id }),
    ...(overrides.last_synced_at && { last_synced_at: overrides.last_synced_at }),
    ...(overrides.max_quantity !== undefined && { max_quantity: overrides.max_quantity }),
    ...(overrides.cost_cents !== undefined && { cost_cents: overrides.cost_cents }),
    ...(overrides.wholesale_price_cents !== undefined && { wholesale_price_cents: overrides.wholesale_price_cents }),
    ...(overrides.cogs_price !== undefined && { cogs_price: overrides.cogs_price }),
    ...(overrides.presale_deposit_price !== undefined && { presale_deposit_price: overrides.presale_deposit_price }),
  };
}

/**
 * Create a test VariantConfig (matches products.json variant schema)
 */
export function createTestVariantConfig(overrides: Partial<{
  id: string;
  product_id: string;
  variant_type: string;
  variant_value: string;
  price_modifier: number;
  wholesale_price_modifier: number;
  presale_deposit_modifier: number;
  is_limited_edition: boolean;
  max_quantity: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  media: any[];
  stripe_product_id?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}> & { id: string; product_id: string }): any {
  return {
    id: overrides.id,
    product_id: overrides.product_id,
    variant_type: overrides.variant_type ?? 'color',
    variant_value: overrides.variant_value ?? 'BLACK',
    price_modifier: overrides.price_modifier ?? 0,
    wholesale_price_modifier: overrides.wholesale_price_modifier ?? 0,
    presale_deposit_modifier: overrides.presale_deposit_modifier ?? 0,
    is_limited_edition: overrides.is_limited_edition ?? false,
    ...(overrides.max_quantity !== undefined && overrides.max_quantity !== null && { max_quantity: overrides.max_quantity }),
    media: overrides.media ?? [],
    ...(overrides.stripe_product_id && { stripe_product_id: overrides.stripe_product_id }),
  };
}
