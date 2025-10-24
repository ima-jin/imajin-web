# Testing Strategy

## Overview

This document defines a comprehensive testing approach for the Imajin web platform. We follow a **testing pyramid** with automated validation at every layer, ensuring each development phase is thoroughly validated before proceeding.

**Philosophy:** Test from day 1. Catch issues immediately. Build confidence incrementally.

---

## Testing Pyramid

```
        /\
       /  \      E2E Tests (Playwright)
      /____\     - Critical user flows
     /      \    - Checkout, order lookup
    /________\   Integration Tests (Vitest)
   /          \  - API routes, database ops
  /____________\ - Stripe webhooks, external services
 /              \
/________________\ Unit Tests (Vitest + RTL)
                   - Utilities, business logic
                   - React components, hooks
```

### Layer Breakdown

**Unit Tests** (~60% of tests)

- Pure functions, utilities
- React components in isolation
- Business logic (cart calculations, validation)
- Fast, no external dependencies

**Integration Tests** (~30% of tests)

- API route handlers
- Database operations
- Stripe integration (mocked)
- Webhook processing

**E2E Tests** (~10% of tests)

- Critical user journeys
- Checkout flow
- Order creation
- Admin workflows

---

## Tools & Setup

### Testing Frameworks

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@playwright/test": "^1.40.0",
    "msw": "^2.0.0",
    "@faker-js/faker": "^8.0.0",
    "testcontainers": "^10.0.0"
  }
}
```

### Tool Descriptions

**Vitest**

- Unit and integration test runner
- Fast, ESM-native, Vite-powered
- Drop-in replacement for Jest with better DX

**React Testing Library (RTL)**

- Test React components
- User-centric approach (test behavior, not implementation)
- Works with Vitest

**Playwright**

- E2E testing across browsers
- Reliable, fast, great debugging
- Headless or headed mode

**MSW (Mock Service Worker)**

- Mock API responses in tests
- Intercept network requests
- Realistic integration testing without hitting real APIs

**Faker**

- Generate realistic test data
- Consistent fixtures

**Testcontainers** (optional)

- Spin up real PostgreSQL for integration tests
- Alternative to mocking database

---

## Test File Structure

```
/tests
├── unit/
│   ├── lib/
│   │   ├── utils.test.ts
│   │   ├── validation.test.ts
│   │   └── cart-calculations.test.ts
│   └── components/
│       ├── Button.test.tsx
│       ├── ProductCard.test.tsx
│       └── CartItem.test.tsx
│
├── integration/
│   ├── api/
│   │   ├── products.test.ts
│   │   ├── cart.test.ts
│   │   └── webhooks.test.ts
│   ├── db/
│   │   ├── products-repository.test.ts
│   │   └── orders-repository.test.ts
│   └── stripe/
│       └── checkout-integration.test.ts
│
├── e2e/
│   ├── checkout.spec.ts
│   ├── product-browsing.spec.ts
│   └── admin-order-management.spec.ts
│
├── smoke/
│   ├── phase1-foundation.spec.ts
│   ├── phase2-ecommerce.spec.ts
│   ├── phase3-checkout.spec.ts
│   └── phase4-portfolio.spec.ts
│
├── fixtures/
│   ├── products.ts
│   ├── orders.ts
│   └── users.ts
│
└── helpers/
    ├── vitest.setup.ts
    ├── playwright.setup.ts
    ├── db-helpers.ts
    └── test-helpers.ts
```

### File Naming Convention

**Test Files:**
- Use `.test.ts` or `.test.tsx` for unit and integration tests (Vitest)
- Use `.spec.ts` for E2E and smoke tests (Playwright)
- **DO NOT mix naming conventions** - stick to one pattern per test type

**Test Setup/Helper Files:**
- Use `.setup.ts` suffix for global setup files (e.g., `vitest.setup.ts`)
- Use `-helpers.ts` suffix for helper utilities (e.g., `db-helpers.ts`, `test-helpers.ts`)
- Place in `/tests/helpers/` directory

**Examples:**
- ✅ `cart.test.ts` - Unit/integration test
- ✅ `checkout.spec.ts` - E2E test
- ✅ `db-helpers.ts` - Helper utilities
- ❌ `cart.spec.ts` - Wrong for Vitest tests
- ❌ `checkout.test.ts` - Wrong for Playwright tests

---

## Testing Patterns & Examples

### Unit Test Pattern

**Example: Cart Calculation Utility**

```typescript
// lib/cart.ts
export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
}

export function validateCartItem(item: CartItem): string[] {
  const errors: string[] = [];
  if (item.quantity < 1) errors.push("Quantity must be at least 1");
  if (item.quantity > 50) errors.push("Quantity cannot exceed 50");
  if (item.price < 0) errors.push("Invalid price");
  return errors;
}
```

**Test:**

```typescript
// tests/unit/lib/cart.test.ts
import { describe, it, expect } from "vitest";
import { calculateCartTotal, validateCartItem } from "@/lib/cart";

describe("calculateCartTotal", () => {
  it("calculates total for multiple items", () => {
    const items = [
      { productId: "A", price: 1000, quantity: 2 }, // $10.00 x 2
      { productId: "B", price: 500, quantity: 3 }, // $5.00 x 3
    ];

    expect(calculateCartTotal(items)).toBe(3500); // $35.00
  });

  it("returns 0 for empty cart", () => {
    expect(calculateCartTotal([])).toBe(0);
  });
});

describe("validateCartItem", () => {
  it("returns no errors for valid item", () => {
    const item = { productId: "A", price: 1000, quantity: 5 };
    expect(validateCartItem(item)).toEqual([]);
  });

  it("returns error for quantity too low", () => {
    const item = { productId: "A", price: 1000, quantity: 0 };
    expect(validateCartItem(item)).toContain("Quantity must be at least 1");
  });

  it("returns error for quantity too high", () => {
    const item = { productId: "A", price: 1000, quantity: 100 };
    expect(validateCartItem(item)).toContain("Quantity cannot exceed 50");
  });
});
```

---

### Component Test Pattern

**Example: ProductCard Component**

```typescript
// components/products/ProductCard.tsx
interface ProductCardProps {
  product: {
    id: string
    name: string
    price: number
    image: string
  }
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div data-testid={`product-${product.id}`}>
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>${(product.price / 100).toFixed(2)}</p>
      <button>Add to Cart</button>
    </div>
  )
}
```

**Test:**

```typescript
// tests/unit/components/ProductCard.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductCard } from '@/components/products/ProductCard'

describe('ProductCard', () => {
  const mockProduct = {
    id: 'test-product',
    name: '8x8 Void Panel',
    price: 3500, // $35.00
    image: '/test-image.jpg'
  }

  it('renders product name', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('8x8 Void Panel')).toBeInTheDocument()
  })

  it('formats price correctly', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('$35.00')).toBeInTheDocument()
  })

  it('renders product image with alt text', () => {
    render(<ProductCard product={mockProduct} />)
    const image = screen.getByAltText('8x8 Void Panel')
    expect(image).toHaveAttribute('src', '/test-image.jpg')
  })

  it('has add to cart button', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument()
  })
})
```

---

### Integration Test Pattern

**Example: Products API Route**

```typescript
// app/api/products/route.ts
import { db } from "@/lib/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.dev_status, 5))
    .orderBy(products.category);

  return Response.json({ products: allProducts });
}
```

**Test:**

```typescript
// tests/integration/api/products.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { db } from "@/lib/db";
import { products } from "@/db/schema";
import { GET } from "@/app/api/products/route";

describe("GET /api/products", () => {
  beforeEach(async () => {
    // Seed test data
    await db.insert(products).values([
      { id: "prod-1", name: "Product 1", dev_status: 5, price: 1000 },
      { id: "prod-2", name: "Product 2", dev_status: 3, price: 2000 }, // Not ready
      { id: "prod-3", name: "Product 3", dev_status: 5, price: 3000 },
    ]);
  });

  afterEach(async () => {
    // Clean up
    await db.delete(products);
  });

  it("returns only products with dev_status = 5", async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.products).toHaveLength(2);
    expect(data.products.map((p) => p.id)).toEqual(["prod-1", "prod-3"]);
  });

  it("returns 200 status", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });
});
```

---

### E2E Test Pattern

**Example: Checkout Flow**

```typescript
// tests/e2e/checkout.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Checkout Flow", () => {
  test("user can complete purchase", async ({ page }) => {
    // 1. Browse products
    await page.goto("/");
    await page.click('[data-testid="product-Material-8x8-V"]');

    // 2. Add to cart
    await expect(page.getByRole("heading", { name: "8x8 Void Panel" })).toBeVisible();
    await page.click('button:has-text("Add to Cart")');
    await expect(page.getByText("Added to cart")).toBeVisible();

    // 3. View cart
    await page.click('[data-testid="cart-button"]');
    await expect(page.getByText("8x8 Void Panel")).toBeVisible();
    await expect(page.getByText("$35.00")).toBeVisible();

    // 4. Proceed to checkout
    await page.click('button:has-text("Checkout")');

    // 5. Fill shipping info
    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="name"]', "Test User");
    await page.fill('[name="address"]', "123 Test St");
    await page.fill('[name="city"]', "Toronto");
    await page.fill('[name="postal_code"]', "M5H 2N2");

    // 6. Complete Stripe checkout (test mode)
    await page.click('button:has-text("Continue to Payment")');

    // Fill Stripe test card
    const stripeFrame = page.frameLocator('iframe[name*="stripe"]');
    await stripeFrame.fill('[name="cardnumber"]', "4242424242424242");
    await stripeFrame.fill('[name="exp-date"]', "1230");
    await stripeFrame.fill('[name="cvc"]', "123");
    await stripeFrame.fill('[name="postal"]', "M5H 2N2");

    // 7. Submit payment
    await page.click('button:has-text("Pay")');

    // 8. Verify success
    await expect(page).toHaveURL(/\/checkout\/success/);
    await expect(page.getByText("Order confirmed")).toBeVisible();
  });

  test("shows error for invalid card", async ({ page }) => {
    // Navigate to checkout with item in cart
    await page.goto("/checkout?test-cart=true");

    // Fill form
    await page.fill('[name="email"]', "test@example.com");
    // ... fill other fields

    // Use Stripe test card that will be declined
    const stripeFrame = page.frameLocator('iframe[name*="stripe"]');
    await stripeFrame.fill('[name="cardnumber"]', "4000000000000002");
    await stripeFrame.fill('[name="exp-date"]', "1230");
    await stripeFrame.fill('[name="cvc"]', "123");

    await page.click('button:has-text("Pay")');

    // Verify error message
    await expect(page.getByText(/card was declined/i)).toBeVisible();
  });
});
```

---

## Smoke Test Suite

The smoke test suite grows with each phase, validating that all previous functionality still works.

### Phase 1: Foundation Smoke Tests

```typescript
// tests/smoke/phase1-foundation.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Phase 1: Foundation Smoke Tests", () => {
  test("database connection works", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.database).toBe("connected");
  });

  test("app serves homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Imajin/i);
  });

  test("docker containers are healthy", async ({ request }) => {
    const response = await request.get("/api/health");
    const data = await response.json();

    expect(data.status).toBe("ok");
    expect(data.database).toBe("connected");
  });
});
```

### Phase 2: E-commerce Core Smoke Tests

```typescript
// tests/smoke/phase2-ecommerce.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Phase 2: E-commerce Core Smoke Tests", () => {
  // Re-run Phase 1 tests
  test("Phase 1: foundation still works", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
  });

  // New Phase 2 validation
  test("products API returns data", async ({ request }) => {
    const response = await request.get("/api/products");
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.products).toBeDefined();
    expect(Array.isArray(data.products)).toBe(true);
  });

  test("product listing page renders", async ({ page }) => {
    await page.goto("/products");
    await expect(page.getByTestId("product-grid")).toBeVisible();
  });

  test("product detail page loads", async ({ page }) => {
    await page.goto("/products/Material-8x8-V");
    await expect(page.getByRole("heading", { name: /8x8 void panel/i })).toBeVisible();
  });

  test("cart functionality works", async ({ page }) => {
    await page.goto("/products/Material-8x8-V");
    await page.click('button:has-text("Add to Cart")');

    await page.click('[data-testid="cart-button"]');
    await expect(page.getByText("8x8 Void Panel")).toBeVisible();
  });
});
```

### Running Smoke Tests

```bash
# Run all smoke tests (validates all phases)
npm run test:smoke

# Run specific phase smoke tests
npm run test:smoke -- phase1
npm run test:smoke -- phase2

# Run smoke tests in CI (must pass before deploy)
npm run test:smoke:ci
```

---

## Phase-Specific Testing Requirements

### Phase 1: Foundation & Infrastructure

**Must Have Before Proceeding:**

- ✅ Database connection test passes
- ✅ Docker containers start successfully
- ✅ Health check endpoint returns 200
- ✅ Environment variables load correctly
- ✅ Can seed database with sample data

**Tests to Write:**

```
tests/integration/db/connection.test.ts
tests/integration/api/health.test.ts
tests/smoke/phase1-foundation.spec.ts
```

---

### Phase 2: E-commerce Core

**Must Have Before Proceeding:**

- ✅ Phase 1 smoke tests still pass
- ✅ Products API returns expected data
- ✅ Product listing page renders products
- ✅ Product detail page loads correctly
- ✅ Cart add/remove/update works
- ✅ Cart persists in localStorage
- ✅ Variant selector works

**Tests to Write:**

```
tests/integration/api/products.test.ts
tests/unit/lib/cart-calculations.test.ts
tests/unit/components/ProductCard.test.tsx
tests/unit/components/CartItem.test.tsx
tests/smoke/phase2-ecommerce.spec.ts
```

---

### Phase 3: Checkout & Payments

**Must Have Before Proceeding:**

- ✅ Phase 1 & 2 smoke tests still pass
- ✅ Stripe checkout session creates successfully
- ✅ Webhook handler processes payment
- ✅ Order record created in database
- ✅ Inventory decremented correctly
- ✅ E2E checkout flow completes
- ✅ Order confirmation page displays
- ✅ Email sent (if implemented)

**Tests to Write:**

```
tests/integration/api/checkout.test.ts
tests/integration/stripe/webhook.test.ts
tests/integration/db/orders-repository.test.ts
tests/e2e/checkout.spec.ts
tests/smoke/phase3-checkout.spec.ts
```

---

### Phase 4: Portfolio & Admin

**Must Have Before Proceeding:**

- ✅ Phase 1, 2, 3 smoke tests still pass
- ✅ Portfolio items display correctly
- ✅ Admin auth works
- ✅ Order management CRUD works
- ✅ NFT tracking functional

**Tests to Write:**

```
tests/integration/api/portfolio.test.ts
tests/integration/api/admin/orders.test.ts
tests/unit/components/admin/OrdersList.test.tsx
tests/e2e/admin-order-management.spec.ts
tests/smoke/phase4-portfolio.spec.ts
```

---

## Test Configuration

### Vitest Config

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["node_modules/", "tests/", ".next/", "**/*.config.*"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
```

### Vitest Setup File

```typescript
// tests/setup/vitest.setup.ts
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, afterAll } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Setup test database
beforeAll(async () => {
  // Connect to test database
  // Run migrations
  // Seed test data if needed
});

// Teardown
afterAll(async () => {
  // Close database connections
  // Clean up resources
});
```

### Playwright Config

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Add more browsers as needed
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Running Tests

### NPM Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:smoke": "playwright test tests/smoke",
    "test:smoke:ci": "playwright test tests/smoke --reporter=line",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

### Command Reference

```bash
# Run all unit + integration tests (fast)
npm test

# Run tests in watch mode (during development)
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run smoke tests (phase validation)
npm run test:smoke

# Generate coverage report
npm run test:coverage

# Open Vitest UI (interactive test runner)
npm run test:ui

# Run specific test file
npm test tests/unit/lib/cart.test.ts

# Run tests matching pattern
npm test -- cart
```

---

## CI Integration

Tests must pass in GitHub Actions before deployment.

### Test Workflow

```yaml
# .github/workflows/test.yml
name: Test

on:
  pull_request:
  push:
    branches: [develop, main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: imajin_test
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: imajin_test
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        env:
          DATABASE_URL: postgresql://imajin_test:test_password@localhost:5432/imajin_test
        run: npm run test:integration

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Run smoke tests
        run: npm run test:smoke:ci

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: playwright-report/
```

---

## Testing Best Practices

### DO

✅ **Write tests alongside code** - Don't save testing for later
✅ **Test behavior, not implementation** - Users don't care about internal state
✅ **Use descriptive test names** - `it('shows error when quantity exceeds limit')`
✅ **Keep tests isolated** - Each test should run independently
✅ **Use factories/fixtures** - Reusable test data generators
✅ **Mock external services** - Don't hit real Stripe/Cloudinary in tests
✅ **Run smoke tests before committing** - Catch regressions early
✅ **Test error cases** - Not just happy paths

### DON'T

❌ **Don't skip tests to move faster** - You'll pay later with debugging time
❌ **Don't test implementation details** - Test public interfaces
❌ **Don't write brittle tests** - Avoid hardcoded IDs, fragile selectors
❌ **Don't share state between tests** - Each test should be independent
❌ **Don't ignore flaky tests** - Fix or remove them
❌ **Don't test third-party libraries** - Trust that React/Next.js work
❌ **Don't commit with failing tests** - Fix or skip them with `.skip`

---

## Troubleshooting

### Tests Are Slow

**Problem:** Tests take too long to run
**Solutions:**

- Run unit tests in watch mode (`npm run test:watch`)
- Use `test.concurrent` for independent tests
- Mock slow operations (database, network)
- Run E2E tests only in CI, not locally every time

### Tests Are Flaky

**Problem:** Tests pass sometimes, fail other times
**Solutions:**

- Add explicit waits in E2E tests (`await expect(...).toBeVisible()`)
- Ensure tests are isolated (clean up database between tests)
- Avoid time-dependent assertions
- Use deterministic test data

### Can't Mock Module

**Problem:** Vitest mock not working
**Solutions:**

- Use `vi.mock()` at top of file
- Check module path is correct
- Use `vi.mocked()` for typed mocks
- See Vitest docs on mocking

### Playwright Test Fails Locally But Passes in CI

**Problem:** Environment differences
**Solutions:**

- Check baseURL in config
- Ensure database is seeded consistently
- Use `--headed` mode to debug visually
- Check for race conditions (add waits)

---

## Example Test Data Factories

```typescript
// tests/fixtures/products.ts
import { faker } from "@faker-js/faker";

export function createProduct(overrides = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    category: "material",
    dev_status: 5,
    base_price: faker.number.int({ min: 1000, max: 10000 }),
    is_active: true,
    has_variants: false,
    created_at: faker.date.past(),
    updated_at: faker.date.recent(),
    ...overrides,
  };
}

export function createCartItem(overrides = {}) {
  return {
    productId: faker.string.uuid(),
    variantId: null,
    quantity: faker.number.int({ min: 1, max: 5 }),
    price: faker.number.int({ min: 1000, max: 10000 }),
    ...overrides,
  };
}
```

---

## Success Metrics

Track these to measure testing effectiveness:

- **Test Coverage:** Aim for >80% on critical paths
- **Build Time:** Keep CI under 10 minutes
- **Flaky Test Rate:** <5% flakiness acceptable
- **Bugs Found in Production:** Should decrease over time
- **Developer Confidence:** Can refactor without fear

---

## Resources

### Documentation

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Docs](https://playwright.dev/)
- [MSW Docs](https://mswjs.io/)

### Learning

- [Testing JavaScript](https://testingjavascript.com/) - Kent C. Dodds
- [Playwright Tutorial](https://playwright.dev/docs/intro)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Document Created:** 2025-10-23
**Last Updated:** 2025-10-23
**Status:** Complete - Ready for implementation
