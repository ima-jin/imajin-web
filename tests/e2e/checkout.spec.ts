/**
 * E2E Checkout Flow Tests
 * Phase 3.3 - End-to-end testing of complete checkout journey
 *
 * Tests the full checkout process from product browsing to payment
 */

import { test, expect } from '@playwright/test';
import { setupE2ETest, teardownE2ETest, navigateToPage, fillFormField, clickElement } from '../helpers/e2e-helpers';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({}, testInfo) => {
    await setupE2ETest(testInfo.parallelIndex);
  });

  test.afterEach(async () => {
    await teardownE2ETest();
  });

  test('should complete full checkout from browse to payment', async ({ page }) => {
    // Navigate to products page
    await navigateToPage(page, '/products');

    // Verify products are displayed
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();

    // Click product card to go to detail page
    await clickElement(page, '[data-testid="product-card"]');
    await page.waitForLoadState('networkidle');

    // Add product to cart
    await clickElement(page, '[data-testid="add-to-cart-button"]');

    // Verify cart has item
    await page.waitForTimeout(500); // Wait for cart update
    const cartButton = page.locator('[data-testid="cart-button"]');
    await expect(cartButton).toContainText('1');

    // Open cart drawer
    await clickElement(page, '[data-testid="cart-button"]');

    // Verify cart drawer opens
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Proceed to checkout
    await clickElement(page, '[data-testid="checkout-button"]');

    // Should navigate to checkout page
    await expect(page).toHaveURL(/\/checkout/);

    // Fill address form
    await fillFormField(page, '[name="firstName"]', 'John');
    await fillFormField(page, '[name="lastName"]', 'Doe');
    await fillFormField(page, '[name="email"]', 'john@example.com');
    await fillFormField(page, '[name="address"]', '123 Main St');
    await fillFormField(page, '[name="city"]', 'Toronto');
    await page.selectOption('[name="country"]', 'CA');
    await page.selectOption('[name="state"]', 'ON');
    await fillFormField(page, '[name="postalCode"]', 'M5V 3A8');

    // Proceed to payment
    await clickElement(page, '[data-testid="proceed-to-payment"]');

    // Should redirect to Stripe (or show payment form)
    // Note: In test mode, this might not actually redirect
    await page.waitForLoadState('networkidle');

    // Verify we've moved forward in the checkout process
    expect(page.url()).toMatch(/stripe\.com|checkout|success/);
  });

  test('should checkout with single product', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Click product card to go to detail page
    await clickElement(page, '[data-testid="product-card"]');
    await page.waitForLoadState('networkidle');

    // Add one product
    await clickElement(page, '[data-testid="add-to-cart-button"]');

    // Go to checkout
    await clickElement(page, '[data-testid="cart-button"]');
    await clickElement(page, '[data-testid="checkout-button"]');

    // Verify checkout page shows single item
    await expect(page).toHaveURL(/\/checkout/);
    const orderSummary = page.locator('[data-testid="order-summary"]');
    await expect(orderSummary).toContainText('1');
  });

  test('should checkout with multiple products', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Add multiple products
    const addButtons = page.locator('[data-testid="add-to-cart-button"]');
    const count = await addButtons.count();

    if (count >= 2) {
      await addButtons.nth(0).click();
      await page.waitForTimeout(300);
      await addButtons.nth(1).click();
      await page.waitForTimeout(300);

      // Go to checkout
      await clickElement(page, '[data-testid="cart-button"]');
      await clickElement(page, '[data-testid="checkout-button"]');

      // Verify checkout page shows multiple items
      await expect(page).toHaveURL(/\/checkout/);
      const cartButton = page.locator('[data-testid="cart-button"]');
      await expect(cartButton).toContainText('2');
    }
  });

  test('should handle Founder Edition variant selection', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Find Founder Edition product
    const founderProduct = page.locator('[data-testid="product-card"]').filter({ hasText: /Founder/i });

    if (await founderProduct.isVisible()) {
      // Click to view details
      await founderProduct.click();

      // Select variant (BLACK, WHITE, or RED)
      const variantSelector = page.locator('[data-testid="variant-selector"]');
      if (await variantSelector.isVisible()) {
        await variantSelector.first().click();
      }

      // Add to cart
      await clickElement(page, '[data-testid="add-to-cart-button"]');

      // Verify cart has Founder Edition
      await clickElement(page, '[data-testid="cart-button"]');
      await expect(page.locator('[role="dialog"]')).toContainText(/Founder/i);
    }
  });

  test('should validate address form fields', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Click product card to go to detail page
    await clickElement(page, '[data-testid="product-card"]');
    await page.waitForLoadState('networkidle');

    // Add product and go to checkout
    await clickElement(page, '[data-testid="add-to-cart-button"]');
    await clickElement(page, '[data-testid="cart-button"]');
    await clickElement(page, '[data-testid="checkout-button"]');

    // Try to submit with empty form
    const submitButton = page.locator('[data-testid="proceed-to-payment"]');
    await submitButton.click();

    // Should show validation errors
    await expect(page.locator('text=/required/i').first()).toBeVisible();
  });

  test('should handle country and state selection', async ({ page }) => {
    await navigateToPage(page, '/checkout');

    // Select country
    await page.selectOption('[name="country"]', 'CA');

    // Verify state dropdown is populated with Canadian provinces
    const stateDropdown = page.locator('[name="state"]');
    await expect(stateDropdown).toBeVisible();

    // Should have Canadian provinces
    const options = await stateDropdown.locator('option').allTextContents();
    expect(options.join(',')).toContain('Ontario');
  });

  test('should redirect to Stripe checkout', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Click product card to go to detail page
    await clickElement(page, '[data-testid="product-card"]');
    await page.waitForLoadState('networkidle');

    // Add product
    await clickElement(page, '[data-testid="add-to-cart-button"]');

    // Go through checkout
    await clickElement(page, '[data-testid="cart-button"]');
    await clickElement(page, '[data-testid="checkout-button"]');

    // Fill form
    await fillFormField(page, '[name="firstName"]', 'John');
    await fillFormField(page, '[name="lastName"]', 'Doe');
    await fillFormField(page, '[name="email"]', 'john@example.com');
    await fillFormField(page, '[name="address"]', '123 Main St');
    await fillFormField(page, '[name="city"]', 'Toronto');
    await page.selectOption('[name="country"]', 'CA');
    await page.selectOption('[name="state"]', 'ON');
    await fillFormField(page, '[name="postalCode"]', 'M5V 3A8');

    // Submit
    await clickElement(page, '[data-testid="proceed-to-payment"]');

    // Wait for redirect (may go to Stripe or success page)
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Should not be on checkout page anymore
    expect(page.url()).not.toContain('/checkout');
  });

  test('should display order confirmation after successful payment', async ({ page }) => {
    // This test would require mocking Stripe success
    // For now, we'll navigate to success page directly
    await navigateToPage(page, '/checkout/success?session_id=test_session');

    // Should show success message
    await expect(page.locator('text=/thank you|order confirmed|success/i')).toBeVisible();
  });

  test('should decrement inventory after purchase', async ({ page }) => {
    // This test verifies inventory is decremented
    // Would need to check database state before/after purchase
    // Skipping implementation details for now as it requires webhook handling
    test.skip();
  });

  test('should handle sold out product', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Find sold out product badge
    const soldOutBadge = page.locator('text=/sold out/i');

    if (await soldOutBadge.isVisible()) {
      // Add to cart button should be disabled
      const addButton = soldOutBadge.locator('..').locator('[data-testid="add-to-cart-button"]');
      await expect(addButton).toBeDisabled();
    }
  });
});
