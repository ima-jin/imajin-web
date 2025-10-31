/**
 * Test Fixture Re-exports
 *
 * This file re-exports test fixtures from tests/fixtures/products.ts.
 * Import directly from products.ts for new code.
 */

// Re-export from primary location
export {
  createMockProduct,
  createMockDbProduct,
  createMockDbVariant,
  createFeaturedProduct,
  createPortfolioProduct,
  type DbProduct,
  type DbVariant,
} from './products';

// Additional legacy alias
export { createMockDbVariant as createMockVariant } from './products';
