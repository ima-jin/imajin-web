# Phase 2.6: E2E & Smoke Tests

**Status:** Not Started (Deferred)
**Priority:** High (before Phase 2 sign-off)
**Estimated:** 1-2 days

---

## Overview

Comprehensive end-to-end and smoke test suite to validate entire Phase 2 functionality after all sub-phases complete.

**Current Test Coverage:**
- ✅ Unit tests: 649 passing
- ✅ Integration tests: All passing
- ❌ E2E tests: 0 (need to create)
- ❌ Smoke tests: Phase 1 only (need Phase 2)

---

## Deferred E2E Tests

### 1. Checkout Flow E2E (`tests/e2e/checkout.spec.ts`)

**Scope:** Full checkout flow with Stripe test mode

```typescript
test.describe('Checkout Flow', () => {
  test('user can complete purchase with test card', async ({ page }) => {
    // Add product to cart
    await page.goto('/products');
    await page.click('[data-testid="product-Material-8x8-V"]');
    await page.selectOption('select[name="variant"]', 'BLACK');
    await page.click('button:has-text("Add to Cart")');

    // Open cart and checkout
    await page.click('[data-testid="cart-button"]');
    await expect(page.getByText('8x8 Void Panel')).toBeVisible();
    await page.click('button:has-text("Checkout")');

    // Fill shipping form
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="name"]', 'Test User');
    await page.fill('[name="addressLine1"]', '123 Test St');
    await page.fill('[name="city"]', 'San Francisco');
    await page.selectOption('[name="state"]', 'CA');
    await page.fill('[name="postalCode"]', '94102');

    // Submit to Stripe
    await page.click('button:has-text("Continue to Payment")');

    // Wait for Stripe redirect
    await page.waitForURL(/checkout.stripe.com/);

    // Fill Stripe test card
    await page.frameLocator('iframe[name*="stripe"]').locator('[name="cardnumber"]').fill('4242424242424242');
    await page.frameLocator('iframe[name*="stripe"]').locator('[name="exp-date"]').fill('1230');
    await page.frameLocator('iframe[name*="stripe"]').locator('[name="cvc"]').fill('123');
    await page.frameLocator('iframe[name*="stripe"]').locator('[name="postal"]').fill('94102');

    // Complete payment
    await page.click('button:has-text("Pay")');

    // Verify success
    await expect(page).toHaveURL(/\/checkout\/success/);
    await expect(page.getByText('Order Confirmed')).toBeVisible();
  });

  test('displays error for declined card', async ({ page }) => {
    // ... test with card 4000000000000002 (declined)
  });

  test('handles empty cart redirect', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page).toHaveURL('/products');
  });
});
```

### 2. Product Browsing E2E (`tests/e2e/product-browsing.spec.ts`)

```typescript
test.describe('Product Browsing', () => {
  test('user can browse products and view details', async ({ page }) => {
    await page.goto('/products');

    // Verify product listing
    await expect(page.getByText('Founder Edition')).toBeVisible();
    await expect(page.getByText('Material-8x8-V')).toBeVisible();

    // Filter by category
    await page.check('input[value="material"]');
    await expect(page.getByText('Material-8x8-V')).toBeVisible();

    // View product details
    await page.click('text=Material-8x8-V');
    await expect(page).toHaveURL(/\/products\/Material-8x8-V/);
    await expect(page.getByText('8x8 Void Panel')).toBeVisible();
  });

  test('variant selector updates price and availability', async ({ page }) => {
    await page.goto('/products/Founder-8x8-V');

    // Check BLACK variant
    await page.selectOption('select[name="variant"]', 'BLACK');
    await expect(page.getByText('500 remaining')).toBeVisible();

    // Check RED variant
    await page.selectOption('select[name="variant"]', 'RED');
    await expect(page.getByText('200 remaining')).toBeVisible();
  });
});
```

### 3. Shopping Cart E2E (`tests/e2e/shopping-cart.spec.ts`)

```typescript
test.describe('Shopping Cart', () => {
  test('cart persists across page navigation', async ({ page }) => {
    // Add item
    await page.goto('/products/Material-8x8-V');
    await page.click('button:has-text("Add to Cart")');

    // Navigate away
    await page.goto('/');

    // Check cart still has item
    await page.click('[data-testid="cart-button"]');
    await expect(page.getByText('Material-8x8-V')).toBeVisible();
  });

  test('can update quantities and remove items', async ({ page }) => {
    await page.goto('/products/Material-8x8-V');
    await page.click('button:has-text("Add to Cart")');
    await page.click('[data-testid="cart-button"]');

    // Increase quantity
    await page.click('[aria-label="Increase quantity"]');
    await expect(page.getByText('Qty: 2')).toBeVisible();

    // Remove item
    await page.click('[aria-label="Remove item from cart"]');
    await expect(page.getByText('Your cart is empty')).toBeVisible();
  });
});
```

---

## Smoke Test Suite (`tests/smoke/phase2-ecommerce.spec.ts`)

**Purpose:** Quick validation that all Phase 2 features work after deployment

```typescript
import { test, expect } from '@playwright/test';

test.describe('Phase 2: E-commerce Core - Smoke Tests', () => {
  // Products API
  test('GET /api/products returns products', async ({ request }) => {
    const response = await request.get('/api/products');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
  });

  // Product pages
  test('product listing page loads', async ({ page }) => {
    await page.goto('/products');
    await expect(page).toHaveTitle(/Products/);
    await expect(page.getByText('Founder Edition')).toBeVisible();
  });

  test('product detail page loads', async ({ page }) => {
    await page.goto('/products/Material-8x8-V');
    await expect(page.getByText('8x8 Void Panel')).toBeVisible();
    await expect(page.getByRole('button', { name: /Add to Cart/ })).toBeVisible();
  });

  // Cart functionality
  test('can add item to cart', async ({ page }) => {
    await page.goto('/products/Material-8x8-V');
    await page.click('button:has-text("Add to Cart")');
    await page.click('[data-testid="cart-button"]');
    await expect(page.getByText('Material-8x8-V')).toBeVisible();
  });

  // Checkout
  test('checkout page loads for cart with items', async ({ page, context }) => {
    // Add item via localStorage (faster than UI)
    await context.addCookies([]);
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('imajin_cart', JSON.stringify([{
        productId: 'Material-8x8-V',
        name: 'Material-8x8-V',
        price: 5000,
        stripeProductId: 'price_test',
        image: '/test.jpg',
        quantity: 1
      }]));
    });

    await page.goto('/checkout');
    await expect(page.getByText('Checkout')).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue to Payment/ })).toBeVisible();
  });

  // Variants
  test('variant selector displays limited edition info', async ({ page }) => {
    await page.goto('/products/Founder-8x8-V');
    await expect(page.getByText(/remaining/)).toBeVisible();
  });
});
```

---

## Test Data Requirements

**Stripe Test Mode:**
- Test publishable key configured in `.env.local`
- Test secret key configured in `.env.local`
- Webhook endpoint configured in Stripe dashboard (for local testing: use Stripe CLI)

**Database:**
- Test products seeded (Founder Edition with variants)
- Test database isolated from dev/prod

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

---

## Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run specific E2E suite
npx playwright test tests/e2e/checkout.spec.ts

# Run smoke tests
npm run test:smoke -- phase2

# Run all tests (unit + integration + e2e + smoke)
npm run test:all
```

---

## Success Criteria

- [ ] All E2E tests passing (checkout, browsing, cart)
- [ ] Smoke test suite created and passing
- [ ] No console errors during E2E runs
- [ ] Stripe test mode checkout completes successfully
- [ ] Order created in database after successful payment
- [ ] Limited edition quantities decrement correctly
- [ ] Phase 1 smoke tests still pass (no regressions)

---

## Notes

- **Deferred from Phase 2.4** to focus on core functionality first
- Must complete before Phase 2 sign-off
- Consider running smoke tests in CI/CD pipeline
- Stripe webhook testing may require Stripe CLI for local development
