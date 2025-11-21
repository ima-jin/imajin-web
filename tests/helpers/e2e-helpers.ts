/**
 * E2E Test Helpers
 *
 * Utilities for end-to-end tests with Playwright
 * Provides test isolation and database seeding
 *
 * ## Test Isolation Strategy: Worker-Based Isolation
 *
 * **Why worker-based instead of transaction-based?**
 *
 * E2E tests run the browser against a separate Next.js web server process.
 * The web server needs to read committed data from the database to serve it.
 * Transaction-based isolation (BEGIN...ROLLBACK) would make test data invisible
 * to the web server because uncommitted transactions are not visible to other
 * database connections.
 *
 * **How worker-based isolation works:**
 * 1. Each Playwright worker gets a unique ID (0, 1, 2, etc.)
 * 2. Test data uses worker-specific IDs: `test-product-e2e-w0-1`, `test-product-e2e-w1-1`
 * 3. Data is committed to the database (visible to web server)
 * 4. Cleanup happens in afterEach via `teardownE2ETest()`
 * 5. No conflicts when tests run in parallel
 *
 * **Trade-offs:**
 * - ✅ Web server can see test data (required for E2E)
 * - ✅ Tests run in parallel without conflicts
 * - ✅ Simple and reliable
 * - ⚠️ Requires manual cleanup (handled by teardownE2ETest)
 * - ⚠️ Slightly slower than transaction rollback
 *
 * **When to use transaction-based isolation:**
 * - Integration tests that only test database/service layers directly
 * - No web server involved
 * - See `setupE2ETestWithTransaction()` below (reserved for future use)
 */

import type { Page } from '@playwright/test';
import { createTestDbConnection, closeTestDbConnection } from './db-helpers';
import * as schema from '@/db/schema';

/**
 * Clear E2E test data for a specific worker
 * E2E-specific implementation that doesn't require NODE_ENV=test
 * @param db Database connection
 * @param workerId Worker ID to clear data for (if undefined, clears all test data)
 */
async function clearE2ETestData(
  db: ReturnType<typeof import('drizzle-orm/postgres-js').drizzle>,
  workerId?: number
) {
  // Only allow clearing if using test database
  const connectionString = process.env.DATABASE_URL || '';
  if (!connectionString.includes('test') && !connectionString.includes('5435') && !connectionString.includes('localhost')) {
    throw new Error('E2E tests must use test database! Check DATABASE_URL.');
  }

  if (workerId !== undefined) {
    // Delete only this worker's test data
    const { sql } = await import('drizzle-orm');

    // Delete in correct order to respect foreign key constraints
    // Filter by worker-specific IDs
    const workerPattern = `test-%e2e-w${workerId}%`;

    await db.delete(schema.variants).where(sql`${schema.variants.id} LIKE ${workerPattern}`);
    await db.delete(schema.products).where(sql`${schema.products.id} LIKE ${workerPattern}`);
  } else {
    // Delete all test data (used for global cleanup)
    await db.delete(schema.portfolioImages);
    await db.delete(schema.portfolioItems);
    await db.delete(schema.nftTokens);
    await db.delete(schema.orderItems);
    await db.delete(schema.orders);
    await db.delete(schema.productSpecs);
    await db.delete(schema.productDependencies);
    await db.delete(schema.variants);
    await db.delete(schema.products);
  }
}

/**
 * Seed E2E test data with unique IDs per worker
 * Creates minimal test products for E2E testing
 * @param db Database connection
 * @param workerId Worker ID for unique test data (defaults to 0)
 */
async function seedE2ETestData(
  db: ReturnType<typeof import('drizzle-orm/postgres-js').drizzle>,
  workerId: number = 0
) {
  const productId = `test-product-e2e-w${workerId}-1`;
  const variantId = `test-variant-e2e-w${workerId}-1`;
  const stripeProductId = `prod_test_e2e_w${workerId}_1`;
  const stripePriceId = `price_test_e2e_w${workerId}_1`;

  // Create test product
  await db.insert(schema.products).values({
    id: productId,
    name: `Test LED Panel (Worker ${workerId})`,
    category: 'material',
    devStatus: 5,
    sellStatus: 'for-sale',
    isLive: true,
    isActive: true,
    basePriceCents: 15000,
    description: 'Test product for E2E testing',
    stripeProductId: stripeProductId,
  });

  // Create test variant
  await db.insert(schema.variants).values({
    id: variantId,
    productId: productId,
    stripeProductId: stripeProductId,
    stripePriceId: stripePriceId,
    variantType: 'default',
    variantValue: 'STANDARD',
  });
}

/**
 * Setup E2E test environment (committed data approach)
 * Use this for E2E tests where browser interacts with a separate web server
 * Data is committed to the database so the web server can see it
 *
 * Call this in beforeEach to seed database with test data
 * @param workerId Worker ID for parallel test isolation (optional)
 */
export async function setupE2ETest(workerId?: number) {
  const { client, db } = createTestDbConnection();

  try {
    // Clear existing test data for this worker only (or all if no workerId)
    await clearE2ETestData(db, workerId);

    // Seed fresh test data (committed, visible to web server)
    // Use workerId for parallel test isolation
    await seedE2ETestData(db, workerId);

    // Close connection after seeding
    await closeTestDbConnection(client);
  } catch (error) {
    await closeTestDbConnection(client);
    throw error;
  }
}

/**
 * Teardown E2E test environment
 * Call this in afterEach to clean up test data
 */
export async function teardownE2ETest() {
  const { client, db } = createTestDbConnection();

  try {
    // Clean up test data
    await clearE2ETestData(db);
  } finally {
    await closeTestDbConnection(client);
  }
}

/**
 * Setup E2E test with transaction isolation
 *
 * ⚠️ **RESERVED FOR FUTURE USE** ⚠️
 *
 * This function is NOT currently used by E2E tests because:
 * - E2E tests need committed data visible to the web server
 * - Transaction-based isolation keeps data uncommitted (invisible to web server)
 *
 * **When to use this function:**
 * - Integration tests that test database/service layers directly (no web server)
 * - Unit tests that need database state isolation
 * - Tests where browser doesn't need to see the data
 *
 * **Benefits of transaction-based isolation:**
 * - ✅ Automatic cleanup via ROLLBACK (faster than DELETE queries)
 * - ✅ Perfect isolation (data never visible to other connections)
 * - ✅ No risk of test data leaking between tests
 *
 * **Limitations:**
 * - ❌ Cannot be used for E2E tests (web server can't see uncommitted data)
 * - ❌ Requires single database connection per test
 *
 * Usage example (for future integration tests):
 *   let cleanup: (() => Promise<void>) | undefined;
 *
 *   test.beforeEach(async () => {
 *     const result = await setupE2ETestWithTransaction();
 *     cleanup = result.cleanup;
 *   });
 *
 *   test.afterEach(async () => {
 *     if (cleanup) {
 *       await cleanup();
 *       cleanup = undefined;
 *     }
 *   });
 */
export async function setupE2ETestWithTransaction() {
  const { client, db } = createTestDbConnection();

  try {
    // Start transaction
    await client`BEGIN`;

    // Seed test data within transaction
    await seedE2ETestData(db);

    return {
      client,
      db,
      cleanup: async () => {
        try {
          // Rollback transaction (automatic cleanup)
          await client`ROLLBACK`;
        } finally {
          await closeTestDbConnection(client);
        }
      },
    };
  } catch (error) {
    // Rollback and cleanup on error
    await client`ROLLBACK`;
    await closeTestDbConnection(client);
    throw error;
  }
}

/**
 * Wait for element with retries
 * Useful for waiting for dynamic content
 */
export async function waitForElement(
  page: Page,
  selector: string,
  options?: { timeout?: number; state?: 'attached' | 'visible' }
) {
  return await page.waitForSelector(selector, {
    timeout: options?.timeout || 10000,
    state: options?.state || 'visible',
  });
}

/**
 * Fill form field safely
 * Waits for field to be ready before filling
 */
export async function fillFormField(page: Page, selector: string, value: string) {
  await waitForElement(page, selector);
  await page.fill(selector, value);
}

/**
 * Click element safely
 * Waits for element to be ready before clicking
 */
export async function clickElement(page: Page, selector: string) {
  await waitForElement(page, selector);
  await page.click(selector);
}

/**
 * Navigate and wait for page load
 * Ensures page is fully loaded before proceeding
 */
export async function navigateToPage(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}
