/**
 * Shared test fixtures for products and variants
 * Ensures consistent test data across all test files
 */

import { Product } from '@/types/product';
import { DbProduct } from '@/lib/mappers/product-mapper';
import { DbVariant } from '@/lib/mappers/variant-mapper';

/**
 * Create a mock Product with all required fields
 */
export function createMockProduct(overrides?: Partial<Product>): Product {
  return {
    id: 'test-product-1',
    name: 'Test Product',
    description: 'Test description',
    category: 'material',
    devStatus: 5,
    basePrice: 10000,
    isActive: true,
    requiresAssembly: false,
    hasVariants: false,
    maxQuantity: null,
    soldQuantity: 0,
    availableQuantity: null,
    isAvailable: true,

    // Product visibility and sync tracking
    isLive: true,
    costCents: undefined,
    wholesalePriceCents: undefined,
    sellStatus: 'for-sale',
    sellStatusNote: undefined,
    lastSyncedAt: undefined,
    media: [],

    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

/**
 * Create a mock DbProduct with all required fields
 */
export function createMockDbProduct(overrides?: Partial<DbProduct>): DbProduct {
  return {
    id: 'test-product-1',
    name: 'Test Product',
    description: 'Test description',
    category: 'material',
    devStatus: 5,
    basePrice: 10000,
    isActive: true,
    requiresAssembly: false,
    hasVariants: false,
    maxQuantity: null,
    soldQuantity: 0,
    availableQuantity: null,
    isAvailable: true,

    // Product visibility and sync tracking
    isLive: true,
    costCents: null,
    wholesalePriceCents: null,
    sellStatus: 'for-sale',
    sellStatusNote: null,
    lastSyncedAt: null,
    media: [],

    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

/**
 * Create a mock DbVariant with all required fields
 */
export function createMockDbVariant(overrides?: Partial<DbVariant>): DbVariant {
  return {
    id: 'test-variant-1',
    productId: 'test-product-1',
    stripeProductId: 'prod_test123',
    variantType: 'color',
    variantValue: 'BLACK',
    priceModifier: 0,
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

/**
 * Create a mock Variant with all required fields
 */
export function createMockVariant(overrides?: any): any {
  return {
    id: 'test-variant-1',
    productId: 'test-product-1',
    stripeProductId: 'prod_test123',
    variantType: 'color',
    variantValue: 'BLACK',
    priceModifier: 0,
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
