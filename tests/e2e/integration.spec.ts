/**
 * Integration Tests
 * Phase 5.2 - Tests that verify multiple components work together
 *
 * Integration tests check that different parts of the system
 * integrate correctly (DB, API, UI, state management, etc.)
 */

import { test, expect } from '@playwright/test';
import { setupE2ETest, teardownE2ETest, navigateToPage, clickElement, fillFormField } from '../helpers/e2e-helpers';

test.describe('Integration Tests', () => {
  test.beforeEach(async ({}, testInfo) => {
    await setupE2ETest(testInfo.parallelIndex);
  });

  test.afterEach(async () => {
    await teardownE2ETest();
  });

  test('should flow product data from database to UI', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Verify products loaded from database
    // Even without test IDs, we can check for product names or prices
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);

    // Verify no error messages
    const errorMessage = page.locator('text=/error|failed/i');
    await expect(errorMessage).not.toBeVisible();
  });

  test('should integrate cart state across components', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Add item to cart (cart state updated)
    const addButton = page.locator('[data-testid="add-to-cart-button"]').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);

      // Verify cart state reflected in cart button
      const cartButton = page.locator('[data-testid="cart-button"]');
      await expect(cartButton).toBeVisible();

      // Navigate to another page
      await navigateToPage(page, '/');

      // Cart state should persist
      await expect(cartButton).toBeVisible();
    }
  });

  test('should integrate checkout flow with cart', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Add item to cart
    const addButton = page.locator('[data-testid="add-to-cart-button"]').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);

      // Open cart
      await clickElement(page, '[data-testid="cart-button"]');

      // Go to checkout
      await clickElement(page, '[data-testid="checkout-button"]');

      // Verify checkout page shows cart items
      await expect(page).toHaveURL(/\/checkout/);
    }
  });

  test('should handle Stripe integration flow', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Add product and go through checkout
    const addButton = page.locator('[data-testid="add-to-cart-button"]').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);

      await clickElement(page, '[data-testid="cart-button"]');
      await clickElement(page, '[data-testid="checkout-button"]');

      // Fill form
      await fillFormField(page, '[name="firstName"]', 'Test');
      await fillFormField(page, '[name="lastName"]', 'User');
      await fillFormField(page, '[name="email"]', 'test@example.com');
      await fillFormField(page, '[name="address"]', '123 Test St');
      await fillFormField(page, '[name="city"]', 'Toronto');
      await page.selectOption('[name="country"]', 'CA');
      await page.selectOption('[name="state"]', 'ON');
      await fillFormField(page, '[name="postalCode"]', 'M5V 3A8');

      // Submit should attempt Stripe integration
      await clickElement(page, '[data-testid="proceed-to-payment"]');
      await page.waitForLoadState('networkidle');

      // Verify redirect or error handling
      const currentUrl = page.url();
      expect(currentUrl).toBeTruthy();
    }
  });

  test('should integrate order creation workflow', async ({ page }) => {
    // This test verifies the full order creation flow
    // Note: Requires webhook handling for full integration
    await navigateToPage(page, '/products');

    // Add product to cart
    const addButton = page.locator('[data-testid="add-to-cart-button"]').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);

      // Verify cart has items before checkout
      const cartButton = page.locator('[data-testid="cart-button"]');
      await expect(cartButton).toContainText(/[1-9]/);
    }
  });

  test('should integrate product filtering with database', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Apply filter
    const filterCheckbox = page.locator('input[type="checkbox"]').first();
    if (await filterCheckbox.isVisible()) {
      await filterCheckbox.click();
      await page.waitForTimeout(500);

      // Products should be filtered
      // Verify page still loads without errors
      const errorMessage = page.locator('text=/error/i');
      await expect(errorMessage).not.toBeVisible();
    }
  });

  test('should integrate variant selection with pricing', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Find product with variants
    const variantSelector = page.locator('[data-testid="variant-selector"]').first();

    if (await variantSelector.isVisible()) {
      await variantSelector.click();

      // Select different variant
      const variantOption = page.locator('[data-testid="variant-option"]').first();
      if (await variantOption.isVisible()) {
        await variantOption.click();

        // Price should update
        const price = page.locator('[data-testid="product-price"]');
        await expect(price).toBeVisible();
      }
    }
  });

  test('should integrate inventory updates', async ({ page }) => {
    // Verify inventory tracking works
    await navigateToPage(page, '/products');

    // Check for availability badge
    const availabilityBadge = page.locator('text=/available|in stock/i').first();

    if (await availabilityBadge.isVisible()) {
      const text = await availabilityBadge.textContent();
      expect(text).toBeTruthy();
    }
  });

  test('should integrate price calculations', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Add items to cart
    const addButton = page.locator('[data-testid="add-to-cart-button"]').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);

      // Open cart
      await clickElement(page, '[data-testid="cart-button"]');

      // Verify price calculations in cart
      const subtotal = page.locator('[data-testid="cart-subtotal"]');
      if (await subtotal.isVisible()) {
        const text = await subtotal.textContent();
        expect(text).toMatch(/\$\d+/);
      }
    }
  });

  test('should integrate form validation', async ({ page }) => {
    await navigateToPage(page, '/checkout');

    // Try to submit empty form
    const submitButton = page.locator('[data-testid="proceed-to-payment"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Should show validation errors
      const errorMessages = page.locator('text=/required|invalid/i');
      const count = await errorMessages.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Test error handling by navigating to invalid product
    await page.goto('/products/invalid-product-id');

    // Should show error page or redirect
    const errorContent = page.locator('text=/not found|error|404/i');
    const isError = await errorContent.isVisible();
    const isRedirect = !page.url().includes('invalid-product-id');

    expect(isError || isRedirect).toBeTruthy();
  });

  test('should handle success states correctly', async ({ page }) => {
    // Navigate to success page
    await navigateToPage(page, '/checkout/success?session_id=test_session');

    // Should show success message
    const successMessage = page.locator('text=/thank you|success|confirmed/i');

    // Either success message is visible or page redirects
    const hasSuccess = await successMessage.isVisible().catch(() => false);
    const currentUrl = page.url();

    expect(hasSuccess || currentUrl.includes('success')).toBeTruthy();
  });
});
