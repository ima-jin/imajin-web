# Testing Strategy

## Overview

Test from day 1. Catch issues immediately. Build confidence incrementally.

**Testing Pyramid:**

```
        /\
       /  \      E2E Tests (Playwright) - Critical user flows
      /____\
     /      \    Integration Tests (Vitest) - API routes, DB ops, webhooks
    /________\
   /          \  Unit Tests (Vitest + RTL) - Utils, components, business logic
  /____________\
```

**Layer Breakdown:**
- **Unit Tests** (~60%): Pure functions, React components, business logic, fast
- **Integration Tests** (~30%): API routes, database, Stripe integration (mocked)
- **E2E Tests** (~10%): Critical user journeys, checkout, order creation

---

## Tools & Setup

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@playwright/test": "^1.40.0",
    "msw": "^2.0.0",
    "@faker-js/faker": "^8.0.0"
  }
}
```

- **Vitest**: Unit/integration test runner (ESM-native, fast)
- **React Testing Library**: Test React components (user-centric)
- **Playwright**: E2E testing across browsers
- **MSW**: Mock API responses in tests
- **Faker**: Generate realistic test data

---

## Test File Structure

```
/tests
├── unit/
│   ├── lib/ (utils, validation, cart-calculations)
│   └── components/ (Button, ProductCard, CartItem)
├── integration/
│   ├── api/ (products, cart, webhooks)
│   ├── db/ (repositories)
│   └── stripe/ (checkout-integration)
├── e2e/
│   ├── checkout.spec.ts
│   ├── product-browsing.spec.ts
│   └── admin-order-management.spec.ts
├── smoke/
│   ├── phase1-foundation.spec.ts
│   ├── phase2-ecommerce.spec.ts
│   └── phase3-checkout.spec.ts
├── fixtures/ (products, orders, users)
└── helpers/ (vitest.setup.ts, db-helpers.ts)
```

**File Naming:**
- `.test.ts/.tsx` for unit/integration (Vitest)
- `.spec.ts` for E2E/smoke (Playwright)
- `.setup.ts` for global setup files
- `-helpers.ts` for helper utilities

---

## Testing Patterns

### Unit Test Pattern

```typescript
// lib/cart.ts
export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function validateCartItem(item: CartItem): string[] {
  const errors: string[] = [];
  if (item.quantity < 1) errors.push("Quantity must be at least 1");
  if (item.quantity > 50) errors.push("Quantity cannot exceed 50");
  if (item.price < 0) errors.push("Invalid price");
  return errors;
}
```

```typescript
// tests/unit/lib/cart.test.ts
import { describe, it, expect } from "vitest";
import { calculateCartTotal, validateCartItem } from "@/lib/cart";

describe("calculateCartTotal", () => {
  it("calculates total for multiple items", () => {
    const items = [
      { productId: "A", price: 1000, quantity: 2 },
      { productId: "B", price: 500, quantity: 3 },
    ];
    expect(calculateCartTotal(items)).toBe(3500);
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
});
```

---

### Component Test Pattern

```typescript
// components/products/ProductCard.tsx
interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div data-testid={`product-${product.id}`}>
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>${(product.price / 100).toFixed(2)}</p>
      <button>Add to Cart</button>
    </div>
  );
}
```

```typescript
// tests/unit/components/ProductCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ProductCard } from '@/components/products/ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: 'test-product',
    name: '8x8 Void Panel',
    price: 3500,
    image: '/test-image.jpg'
  };

  it('renders product name', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('8x8 Void Panel')).toBeInTheDocument();
  });

  it('formats price correctly', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('$35.00')).toBeInTheDocument();
  });
});
```

---

### Integration Test Pattern

```typescript
// tests/integration/api/products.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { db } from "@/lib/db";
import { products } from "@/db/schema";
import { GET } from "@/app/api/products/route";

describe("GET /api/products", () => {
  beforeEach(async () => {
    await db.insert(products).values([
      { id: "prod-1", name: "Product 1", dev_status: 5, price: 1000 },
      { id: "prod-2", name: "Product 2", dev_status: 3, price: 2000 },
      { id: "prod-3", name: "Product 3", dev_status: 5, price: 3000 },
    ]);
  });

  afterEach(async () => {
    await db.delete(products);
  });

  it("returns only products with dev_status = 5", async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.products).toHaveLength(2);
    expect(data.products.map((p) => p.id)).toEqual(["prod-1", "prod-3"]);
  });
});
```

---

### E2E Test Pattern

```typescript
// tests/e2e/checkout.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Checkout Flow", () => {
  test("user can complete purchase", async ({ page }) => {
    await page.goto("/");
    await page.click('[data-testid="product-Material-8x8-V"]');
    await page.click('button:has-text("Add to Cart")');
    await expect(page.getByText("Added to cart")).toBeVisible();

    await page.click('[data-testid="cart-button"]');
    await page.click('button:has-text("Checkout")');

    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="name"]', "Test User");
    await page.fill('[name="address"]', "123 Test St");

    await page.click('button:has-text("Continue to Payment")');

    const stripeFrame = page.frameLocator('iframe[name*="stripe"]');
    await stripeFrame.fill('[name="cardnumber"]', "4242424242424242");
    await stripeFrame.fill('[name="exp-date"]', "1230");
    await stripeFrame.fill('[name="cvc"]', "123");

    await page.click('button:has-text("Pay")');

    await expect(page).toHaveURL(/\/checkout\/success/);
    await expect(page.getByText("Order confirmed")).toBeVisible();
  });
});
```

---

## Smoke Test Suite

Smoke tests grow with each phase, validating all previous functionality.

### Phase 1: Foundation

```typescript
// tests/smoke/phase1-foundation.spec.ts
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
```

### Phase 2: E-commerce Core

```typescript
// tests/smoke/phase2-ecommerce.spec.ts
test("products API returns data", async ({ request }) => {
  const response = await request.get("/api/products");
  expect(response.status()).toBe(200);

  const data = await response.json();
  expect(Array.isArray(data.products)).toBe(true);
});

test("cart functionality works", async ({ page }) => {
  await page.goto("/products/Material-8x8-V");
  await page.click('button:has-text("Add to Cart")');
  await page.click('[data-testid="cart-button"]');
  await expect(page.getByText("8x8 Void Panel")).toBeVisible();
});
```

---

## Phase-Specific Requirements

### Phase 1: Foundation
- ✅ Database connection test passes
- ✅ Docker containers healthy
- ✅ Health check endpoint returns 200
- ✅ Environment variables load correctly

**Tests:** `tests/integration/db/connection.test.ts`, `tests/smoke/phase1-foundation.spec.ts`

### Phase 2: E-commerce Core
- ✅ Products API returns expected data
- ✅ Product pages render correctly
- ✅ Cart add/remove/update works
- ✅ Cart persists in localStorage
- ✅ Variant selector works

**Tests:** `tests/integration/api/products.test.ts`, `tests/unit/lib/cart-calculations.test.ts`, `tests/smoke/phase2-ecommerce.spec.ts`

### Phase 3: Checkout & Payments
- ✅ Stripe checkout session creates successfully
- ✅ Webhook handler processes payment
- ✅ Order record created in database
- ✅ Inventory decremented correctly
- ✅ E2E checkout flow completes

**Tests:** `tests/integration/api/checkout.test.ts`, `tests/e2e/checkout.spec.ts`, `tests/smoke/phase3-checkout.spec.ts`

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
    setupFiles: ["./tests/helpers/vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["node_modules/", "tests/", ".next/"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
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
    "test:coverage": "vitest run --coverage"
  }
}
```

### Commands

```bash
npm test                    # Run all unit + integration tests
npm run test:watch          # Watch mode (during development)
npm run test:e2e            # Run E2E tests
npm run test:smoke          # Run smoke tests
npm run test:coverage       # Generate coverage report
npm test tests/unit/lib/cart.test.ts  # Run specific test
```

---

## CI Integration

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
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - run: npm run test:smoke:ci
```

---

## Best Practices

**DO:**
- ✅ Write tests alongside code
- ✅ Test behavior, not implementation
- ✅ Use descriptive test names
- ✅ Keep tests isolated
- ✅ Mock external services
- ✅ Run smoke tests before committing

**DON'T:**
- ❌ Skip tests to move faster
- ❌ Test implementation details
- ❌ Share state between tests
- ❌ Ignore flaky tests
- ❌ Commit with failing tests

---

## Troubleshooting

**Tests Are Slow:**
- Run unit tests in watch mode
- Use `test.concurrent` for independent tests
- Mock slow operations
- Run E2E only in CI

**Tests Are Flaky:**
- Add explicit waits in E2E tests
- Ensure test isolation
- Avoid time-dependent assertions
- Use deterministic test data

---

## Test Data Factories

```typescript
// tests/fixtures/products.ts
import { faker } from "@faker-js/faker";

export function createProduct(overrides = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    category: "material",
    dev_status: 5,
    base_price_cents: faker.number.int({ min: 1000, max: 10000 }),
    is_active: true,
    has_variants: false,
    ...overrides,
  };
}
```

---

## Test Database Setup

**Purpose:** Separate test database ensures tests never touch development data.

### Database Configuration

**Development Database:**
```
DATABASE_URL=postgresql://imajin:imajin_dev@localhost:5435/imajin_local
```

**Test Database:**
```
DATABASE_URL=postgresql://imajin:imajin_dev@localhost:5435/imajin_test
```

**Test Environment (`.env.test`):**
```env
NODE_ENV=test
DATABASE_URL=postgresql://imajin:imajin_dev@localhost:5435/imajin_test
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Test Database Scripts

```bash
# Create test database (one-time setup)
npm run test:db:create

# Drop test database (if needed)
npm run test:db:drop

# Reset test database (drop all tables, recreate schema)
npm run test:db:reset

# Seed test database with product data
npm run test:db:seed
```

### Test Database Workflow

**Initial Setup:**
```bash
npm run test:db:create  # Create imajin_test database
npm run db:push         # Push schema to test DB
npm run test:db:seed    # Seed with product data
```

**Reset Between Test Runs:**
```bash
npm run test:db:reset   # Drop & recreate schema
npm run db:push         # Push schema again
npm run test:db:seed    # Re-seed data
```

**Run Tests:**
```bash
npm run test            # Unit + integration tests (uses test DB)
npm run test:e2e        # E2E tests (uses test DB via env)
```

### Test Database Safety

**Safety Checks:**
- `reset-test-db.ts` verifies DATABASE_URL contains "imajin_test"
- Script exits with error if run against dev/prod database
- Test configs (vitest, playwright) explicitly set test DATABASE_URL

**Never:**
- Run `test:db:reset` against development database
- Point tests at `imajin_local` or production database
- Share test database between dev and CI environments

### Test Database in CI/CD

**GitHub Actions (when implemented):**
```yaml
env:
  DATABASE_URL: postgresql://postgres:postgres@localhost:5432/imajin_test
  NODE_ENV: test

steps:
  - name: Create test database
    run: npm run test:db:create

  - name: Push schema
    run: npm run db:push

  - name: Seed test data
    run: npm run test:db:seed

  - name: Run tests
    run: npm test
```

### Integration Test Patterns with Test DB

**Example: Product API Test**
```typescript
describe("GET /api/products", () => {
  beforeAll(async () => {
    // Test DB already configured via vitest.config.ts
    await seedTestProducts(); // Helper to insert test data
  });

  afterAll(async () => {
    await clearTestProducts(); // Clean up
  });

  it("returns only products with dev_status = 5", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.products.every(p => p.devStatus === 5)).toBe(true);
  });
});
```

### Test Data Isolation

**Per-test isolation:**
- Use transactions (BEGIN/ROLLBACK) when possible
- Create unique IDs for each test
- Clean up test data in `afterEach`

**Shared fixtures:**
- Seed common data in `beforeAll`
- Clean up in `afterAll`
- Document shared state clearly

---

**Last Updated:** 2025-10-24
