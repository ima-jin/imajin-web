/**
 * @deprecated This file is deprecated. Use tests/fixtures/products.ts instead.
 *
 * Migration Guide:
 * - createMockProduct() -> import from tests/fixtures/products.ts
 * - createMockDbProduct() -> import from tests/fixtures/products.ts
 * - createMockDbVariant() -> import from tests/fixtures/products.ts
 *
 * This file will be removed in a future update.
 */

// Re-export from new location for backward compatibility
export {
  createMockProduct,
  createMockDbProduct,
  createMockDbVariant,
  createFeaturedProduct,
  createPortfolioProduct,
  type DbProduct,
  type DbVariant,
} from './products';

// Legacy exports with deprecation warnings
import {
  createMockProduct as _createMockProduct,
  createMockDbProduct as _createMockDbProduct,
  createMockDbVariant as _createMockDbVariant,
} from './products';

/**
 * @deprecated Use createMockProduct from tests/fixtures/products.ts
 */
export const createMockProductLegacy = _createMockProduct;

/**
 * @deprecated Use createMockDbProduct from tests/fixtures/products.ts
 */
export const createMockDbProductLegacy = _createMockDbProduct;

/**
 * @deprecated Use createMockDbVariant from tests/fixtures/products.ts
 */
export const createMockVariant = _createMockDbVariant;
