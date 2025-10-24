# Testing Framework

This directory contains the complete testing setup for the Imajin web platform.

## Overview

We follow a testing pyramid approach with automated validation at every layer:

- **Unit Tests** (~60%) - Pure functions, utilities, React components
- **Integration Tests** (~30%) - API routes, database operations, external services
- **E2E Tests** (~10%) - Critical user journeys
- **Smoke Tests** - Phase validation before moving forward

## Directory Structure

```
tests/
├── unit/              # Unit tests (Vitest + React Testing Library)
│   ├── lib/           # Utility and business logic tests
│   └── components/    # React component tests
├── integration/       # Integration tests (Vitest)
│   ├── api/           # API route tests
│   ├── db/            # Database operation tests
│   └── stripe/        # Stripe integration tests
├── e2e/               # End-to-end tests (Playwright)
├── smoke/             # Smoke test suites per phase (Playwright)
├── fixtures/          # Test data generators and fixtures
└── helpers/           # Test configuration and helper utilities
```

## Running Tests

```bash
# Run all unit + integration tests (fast)
npm test

# Run tests in watch mode (during development)
npm run test:watch

# Run specific test suites
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:e2e            # E2E tests (slower)
npm run test:smoke          # Smoke tests (phase validation)

# Generate coverage report
npm run test:coverage

# Open interactive test UI
npm run test:ui

# Run specific test file
npm test tests/unit/lib/cart.test.ts

# Run tests matching pattern
npm test -- cart
```

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from "vitest";
import { calculateTotal } from "@/lib/cart";

describe("calculateTotal", () => {
  it("calculates total correctly", () => {
    const items = [
      { price: 1000, quantity: 2 },
      { price: 500, quantity: 3 },
    ];
    expect(calculateTotal(items)).toBe(3500);
  });
});
```

### Component Test Example

```typescript
import { render, screen } from "@testing-library/react";
import { ProductCard } from "@/components/ProductCard";

describe("ProductCard", () => {
  it("renders product name", () => {
    const product = { name: "8x8 Void Panel", price: 3500 };
    render(<ProductCard product={product} />);
    expect(screen.getByText("8x8 Void Panel")).toBeInTheDocument();
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from "@playwright/test";

test("user can add item to cart", async ({ page }) => {
  await page.goto("/products/Material-8x8-V");
  await page.click('button:has-text("Add to Cart")');
  await expect(page.getByText("Added to cart")).toBeVisible();
});
```

## Database Test Helpers

The test framework includes database helpers for integration tests:

```typescript
import {
  createTestDbConnection,
  closeTestDbConnection,
  clearTestData,
  seedTestData,
  waitForDatabase,
} from "@/tests/helpers/db-helpers";

// Create isolated database connection
const { client, db } = createTestDbConnection();

// Clean up test data
await clearTestData(db);

// Seed minimal test data
await seedTestData(db);

// Wait for database to be ready
const isReady = await waitForDatabase();

// Close connection
await closeTestDbConnection(client);
```

## Testing Philosophy

- **Write tests first** - TDD approach
- **Test behavior, not implementation** - Focus on user-facing functionality
- **Keep tests isolated** - Each test should run independently
- **Use descriptive names** - Test names should explain what they verify
- **Mock external services** - Don't hit real APIs in tests

## Phase Gates

Before moving to the next development phase, all smoke tests must pass:

```bash
# Phase 1 validation
npm run test:smoke -- phase1

# Phase 1 & 2 validation
npm run test:smoke -- phase1 phase2

# All phases validation
npm run test:smoke
```

## Tools

- **Vitest** - Fast unit/integration test runner
- **React Testing Library** - Component testing
- **Playwright** - E2E browser testing
- **MSW** - API mocking
- **Faker** - Test data generation

## Configuration Files

- `vitest.config.ts` - Vitest configuration
- `playwright.config.ts` - Playwright configuration
- `helpers/vitest.setup.ts` - Global test setup
- `helpers/db-helpers.ts` - Database test utilities
- `helpers/test-helpers.ts` - Shared test utilities

## Best Practices

✅ Write tests alongside code
✅ Run smoke tests before committing
✅ Test error cases, not just happy paths
✅ Keep tests fast and focused
✅ Use factories for test data

❌ Don't skip tests to move faster
❌ Don't test implementation details
❌ Don't commit with failing tests
❌ Don't share state between tests

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Project Testing Strategy](../docs/TESTING_STRATEGY.md)

---

**Status:** Framework configured and ready
**Last Updated:** 2025-10-23
