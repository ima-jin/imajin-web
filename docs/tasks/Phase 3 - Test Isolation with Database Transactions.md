# Phase 3 - Test Isolation with Database Transactions

**Status**: Ready for Implementation 🟡
**Created**: 2025-11-06
**Priority**: High
**Estimated Time**: 2-3 hours

---

## Overview

Implement database transaction-based test isolation for E2E tests to enable parallel test execution without conflicts. Currently, tests fail due to duplicate key violations when running in parallel because multiple test files attempt to seed the same test data simultaneously.

---

## Current State

### ✅ What's Complete
- All 46 E2E tests written (checkout, cart, product-browsing, smoke, integration)
- All test IDs added to components
- Test helpers created (`tests/helpers/e2e-helpers.ts`)
- Playwright configured with dotenv for environment variables

### ❌ What's Broken
- **7/46 tests passing** (15% pass rate)
- **5/46 tests failing** due to duplicate key violations
- **34/46 tests not run** (dependent on failing tests)

**Root Cause**: Multiple test files running in parallel try to insert the same test product ID (`test-product-e2e-1`), causing:
```
PostgresError: duplicate key value violates unique constraint "products_pkey"
```

---

## Solution: Database Transactions with Rollback

**Why this approach?**
- ✅ True test isolation - each test gets pristine database state
- ✅ Fast parallel execution - tests don't conflict
- ✅ Automatic cleanup - just rollback, no manual deletion
- ✅ Scalable - works with 10 or 10,000 tests
- ✅ Industry standard - used by professional test suites

**How it works:**
1. Start a database transaction before each test
2. Seed test data within the transaction
3. Run the test
4. Rollback the transaction (automatic cleanup)

---

## Implementation Plan

### Phase 1: Update Test Helpers (30 minutes)

**File**: `tests/helpers/e2e-helpers.ts`

#### 1.1 Add Transaction Support

Replace the current `setupE2ETest()` and `teardownE2ETest()` functions with transaction-based versions:

```typescript
/**
 * Setup E2E test with transaction isolation
 * Call this in beforeEach to start transaction and seed data
 */
export async function setupE2ETestWithTransaction() {
  const { client, db } = createTestDbConnection();

  try {
    // Start transaction
    await client`BEGIN`;

    // Seed test data
    await seedE2ETestData(db);

    return {
      client,
      db,
      // Return cleanup function for teardown
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
```

#### 1.2 Remove Old Functions

Delete these functions (no longer needed):
- `clearE2ETestData()` - Transaction rollback handles cleanup
- `setupE2ETest()` - Replaced by `setupE2ETestWithTransaction()`
- `teardownE2ETest()` - Replaced by cleanup function
- Database URL safety check - Not needed with transactions

---

### Phase 2: Update E2E Test Files (1 hour)

Update all 5 E2E test files to use transaction-based setup/teardown.

#### Pattern to Apply:

**Before (current broken approach):**
```typescript
test.describe('My Tests', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async () => {
    await setupE2ETest();
  });

  test.afterEach(async () => {
    await teardownE2ETest();
  });

  test('my test', async ({ page }) => {
    // ...
  });
});
```

**After (transaction-based approach):**
```typescript
test.describe('My Tests', () => {
  // Remove serial mode - parallel is now safe!
  // test.describe.configure({ mode: 'serial' });  <-- DELETE THIS

  let cleanup: (() => Promise<void>) | undefined;

  test.beforeEach(async () => {
    const result = await setupE2ETestWithTransaction();
    cleanup = result.cleanup;
  });

  test.afterEach(async () => {
    if (cleanup) {
      await cleanup();
      cleanup = undefined;
    }
  });

  test('my test', async ({ page }) => {
    // ...
  });
});
```

#### Files to Update:

1. **`tests/e2e/checkout.spec.ts`** (10 tests)
   - Remove `test.describe.configure({ mode: 'serial' })`
   - Update beforeEach/afterEach pattern

2. **`tests/e2e/product-browsing.spec.ts`** (8 tests)
   - Remove `test.describe.configure({ mode: 'serial' })`
   - Update beforeEach/afterEach pattern

3. **`tests/e2e/cart.spec.ts`** (8 tests)
   - Remove `test.describe.configure({ mode: 'serial' })`
   - Update beforeEach/afterEach pattern

4. **`tests/e2e/integration.spec.ts`** (12 tests)
   - Remove `test.describe.configure({ mode: 'serial' })`
   - Update beforeEach/afterEach pattern

5. **`tests/e2e/smoke.spec.ts`** (8 tests)
   - **Special case**: Only 1-2 tests need database seeding
   - Most smoke tests just check page loads
   - Only add transaction setup to tests that use `setupE2ETest()`

---

### Phase 3: Verification and Testing (30 minutes)

#### 3.1 Run Individual Test Files

```bash
# Test each file individually first
npx playwright test tests/e2e/checkout.spec.ts --project=chromium
npx playwright test tests/e2e/cart.spec.ts --project=chromium
npx playwright test tests/e2e/product-browsing.spec.ts --project=chromium
npx playwright test tests/e2e/integration.spec.ts --project=chromium
npx playwright test tests/e2e/smoke.spec.ts --project=chromium
```

**Expected**: All tests in each file should pass

#### 3.2 Run All Tests in Parallel

```bash
# Run all E2E tests together (full parallel execution)
npx playwright test tests/e2e/ --project=chromium
```

**Expected**: All 46 tests pass with no conflicts

#### 3.3 Verify Database State

After running tests, verify the database is clean:

```bash
# Connect to test database
psql postgresql://imajin:imajin_dev@localhost:5435/imajin_local

# Check for test data (should be empty)
SELECT * FROM products WHERE id LIKE 'test-%';
SELECT * FROM variants WHERE id LIKE 'test-%';
```

**Expected**: No test data remains (all rolled back)

#### 3.4 Performance Check

```bash
# Measure execution time
time npx playwright test tests/e2e/ --project=chromium
```

**Expected**: Tests should complete in 15-30 seconds with parallel execution (vs 2-3 minutes serial)

---

## Detailed Code Changes

### Change 1: Update `tests/helpers/e2e-helpers.ts`

**Remove these functions:**
```typescript
// DELETE: clearE2ETestData()
// DELETE: setupE2ETest()
// DELETE: teardownE2ETest()
```

**Add this function:**
```typescript
/**
 * Setup E2E test with transaction isolation
 *
 * Usage:
 *   let cleanup: (() => Promise<void>) | undefined;
 *
 *   test.beforeEach(async () => {
 *     const result = await setupE2ETestWithTransaction();
 *     cleanup = result.cleanup;
 *   });
 *
 *   test.afterEach(async () => {
 *     if (cleanup) await cleanup();
 *   });
 */
export async function setupE2ETestWithTransaction() {
  const { client, db } = createTestDbConnection();

  try {
    // Start transaction
    await client`BEGIN`;

    // Seed test data within transaction
    await db.insert(schema.products).values({
      id: 'test-product-e2e-1',
      name: 'Test LED Panel',
      category: 'material',
      devStatus: 5,
      sellStatus: 'for-sale',
      isLive: true,
      isActive: true,
      basePrice: 15000,
      description: 'Test product for E2E testing',
      stripeProductId: 'prod_test_e2e_1',
    });

    await db.insert(schema.variants).values({
      id: 'test-variant-e2e-1',
      productId: 'test-product-e2e-1',
      stripeProductId: 'prod_test_e2e_1',
      stripePriceId: 'price_test_e2e_1',
      variantType: 'default',
      variantValue: 'STANDARD',
    });

    return {
      client,
      db,
      cleanup: async () => {
        try {
          await client`ROLLBACK`;
        } finally {
          await closeTestDbConnection(client);
        }
      },
    };
  } catch (error) {
    await client`ROLLBACK`;
    await closeTestDbConnection(client);
    throw error;
  }
}
```

**Keep these utility functions (unchanged):**
- `createTestDbConnection()`
- `closeTestDbConnection()`
- `waitForElement()`
- `fillFormField()`
- `clickElement()`
- `navigateToPage()`

---

### Change 2: Update Test Files

Apply this pattern to all test files that use database seeding:

```typescript
import { test, expect } from '@playwright/test';
import {
  setupE2ETestWithTransaction,  // CHANGED: Import new function
  navigateToPage,
  clickElement
} from '../helpers/e2e-helpers';

test.describe('My Test Suite', () => {
  // REMOVED: test.describe.configure({ mode: 'serial' });

  let cleanup: (() => Promise<void>) | undefined;  // ADDED

  test.beforeEach(async () => {
    const result = await setupE2ETestWithTransaction();  // CHANGED
    cleanup = result.cleanup;  // ADDED
  });

  test.afterEach(async () => {
    if (cleanup) {  // CHANGED
      await cleanup();
      cleanup = undefined;
    }
  });

  test('should do something', async ({ page }) => {
    // Test code remains unchanged
  });
});
```

---

## Common Issues and Solutions

### Issue 1: Transaction Not Rolling Back

**Symptom**: Test data remains in database after tests
**Cause**: Cleanup function not called or error in cleanup
**Solution**: Ensure `cleanup()` is always called, even on test failure

```typescript
test.afterEach(async () => {
  if (cleanup) {
    try {
      await cleanup();
    } catch (error) {
      console.error('Cleanup error:', error);
    } finally {
      cleanup = undefined;
    }
  }
});
```

### Issue 2: Connection Pool Exhaustion

**Symptom**: Tests hang or timeout
**Cause**: Too many simultaneous database connections
**Solution**: Ensure `max: 1` in postgres client config

```typescript
const client = postgres(connectionString, {
  max: 1,  // Critical for transaction isolation
  idle_timeout: 20,
  connect_timeout: 10,
});
```

### Issue 3: Tests Still Fail in Parallel

**Symptom**: Duplicate key errors persist
**Cause**: Old `setupE2ETest()` function still being used
**Solution**: Grep for old function calls and update:

```bash
# Find files still using old pattern
grep -r "setupE2ETest" tests/e2e/
grep -r "teardownE2ETest" tests/e2e/
```

---

## Acceptance Criteria

**Phase complete when:**
- [ ] All 46 E2E tests pass consistently
- [ ] Tests run in parallel without conflicts
- [ ] No test data remains in database after tests
- [ ] Test execution time is <30 seconds
- [ ] All old setup/teardown functions removed
- [ ] All test files updated to use transactions

**Quality checks:**
- [ ] Run tests 3 times in a row - all should pass
- [ ] Check database for test data after run - should be empty
- [ ] Verify parallel execution (multiple test files run simultaneously)
- [ ] No duplicate key violations in test output

---

## Benefits After Implementation

**Before:**
- 7/46 tests passing (15%)
- Tests must run serially (slow)
- Manual cleanup required
- Flaky test failures
- 2-3 minute test runs

**After:**
- 46/46 tests passing (100%)
- Tests run in parallel (fast)
- Automatic cleanup via rollback
- Reliable, deterministic tests
- 15-30 second test runs

---

## Related Documentation

- **Test Strategy**: `docs/TESTING_STRATEGY.md`
- **Current Helpers**: `tests/helpers/e2e-helpers.ts`
- **Test Specs**: `tests/e2e/*.spec.ts`
- **Requirements Doc**: `docs/tasks/Phase 3 - E2E Test Requirements.md`

---

**Last Updated**: 2025-11-06
**Status**: Ready for team execution
