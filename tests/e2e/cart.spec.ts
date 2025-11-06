/**
 * E2E Shopping Cart Tests
 * Phase 4.2 - End-to-end testing of shopping cart functionality
 *
 * Tests adding/removing items, quantity changes, persistence, and cart UI
 */

import { test, expect } from '@playwright/test';
import { setupE2ETest, teardownE2ETest, navigateToPage, clickElement } from '../helpers/e2e-helpers';

test.describe('Shopping Cart', () => {
  test.beforeEach(async ({}, testInfo) => {
    await setupE2ETest(testInfo.parallelIndex);
  });

  test.afterEach(async () => {
    await teardownE2ETest();
  });

  test('should add item to cart', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Initial cart should be empty (badge shows 0 or not visible)
    const cartButton = page.locator('[data-testid="cart-button"]');
    await expect(cartButton).toBeVisible();

    // Click product card to go to detail page
    await clickElement(page, '[data-testid="product-card"]');
    await page.waitForLoadState('networkidle');

    // Add product to cart
    await clickElement(page, '[data-testid="add-to-cart-button"]');

    // Wait for cart update
    await page.waitForTimeout(500);

    // Cart badge should show 1
    await expect(cartButton).toContainText('1');
  });

  test('should remove item from cart', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Click product card to go to detail page
    await clickElement(page, '[data-testid="product-card"]');
    await page.waitForLoadState('networkidle');

    // Add product to cart
    await clickElement(page, '[data-testid="add-to-cart-button"]');
    await page.waitForTimeout(500);

    // Open cart drawer
    await clickElement(page, '[data-testid="cart-button"]');

    // Cart drawer should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Remove item from cart
    await clickElement(page, '[data-testid="remove-item-button"]');
    await page.waitForTimeout(500);

    // Cart should be empty
    const emptyMessage = page.locator('text=/empty|no items/i');
    await expect(emptyMessage).toBeVisible();
  });

  test('should update quantity in cart', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Click product card to go to detail page
    await clickElement(page, '[data-testid="product-card"]');
    await page.waitForLoadState('networkidle');

    // Add product to cart
    await clickElement(page, '[data-testid="add-to-cart-button"]');
    await page.waitForTimeout(500);

    // Open cart drawer
    await clickElement(page, '[data-testid="cart-button"]');

    // Increase quantity
    const increaseButton = page.locator('[data-testid="increase-quantity"]');
    if (await increaseButton.isVisible()) {
      await increaseButton.click();
      await page.waitForTimeout(300);

      // Verify quantity increased
      const quantityInput = page.locator('[data-testid="quantity-input"]');
      await expect(quantityInput).toHaveValue('2');

      // Cart badge should show 2
      const cartButton = page.locator('[data-testid="cart-button"]');
      await expect(cartButton).toContainText('2');
    }
  });

  test('should persist cart across page navigation', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Click product card to go to detail page
    await clickElement(page, '[data-testid="product-card"]');
    await page.waitForLoadState('networkidle');

    // Add product to cart
    await clickElement(page, '[data-testid="add-to-cart-button"]');
    await page.waitForTimeout(500);

    // Verify cart has 1 item
    const cartButton = page.locator('[data-testid="cart-button"]');
    await expect(cartButton).toContainText('1');

    // Navigate to home page
    await navigateToPage(page, '/');

    // Cart should still show 1 item
    await expect(cartButton).toContainText('1');

    // Navigate back to products
    await navigateToPage(page, '/products');

    // Cart should still show 1 item
    await expect(cartButton).toContainText('1');
  });

  test('should display empty cart state', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Open cart drawer without adding items
    await clickElement(page, '[data-testid="cart-button"]');

    // Cart drawer should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Should show empty cart message
    const emptyMessage = page.locator('text=/empty|no items/i');
    await expect(emptyMessage).toBeVisible();

    // Checkout button should be disabled or not visible
    const checkoutButton = page.locator('[data-testid="checkout-button"]');
    if (await checkoutButton.isVisible()) {
      await expect(checkoutButton).toBeDisabled();
    }
  });

  test('should update cart badge when items added', async ({ page }) => {
    await navigateToPage(page, '/products');

    const cartButton = page.locator('[data-testid="cart-button"]');

    // Click first product card to go to detail page
    await clickElement(page, '[data-testid="product-card"]');
    await page.waitForLoadState('networkidle');

    // Add first item
    await clickElement(page, '[data-testid="add-to-cart-button"]');
    await page.waitForTimeout(500);
    await expect(cartButton).toContainText('1');

    // Add second item (if multiple products exist)
    const addButtons = page.locator('[data-testid="add-to-cart-button"]');
    const count = await addButtons.count();

    if (count >= 2) {
      await addButtons.nth(1).click();
      await page.waitForTimeout(500);
      await expect(cartButton).toContainText('2');
    }
  });

  test('should open and close cart drawer', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Open cart drawer
    await clickElement(page, '[data-testid="cart-button"]');

    // Cart drawer should be visible
    const cartDrawer = page.locator('[role="dialog"]');
    await expect(cartDrawer).toBeVisible();

    // Close cart drawer (click close button or overlay)
    const closeButton = page.locator('[data-testid="close-cart"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      // Try clicking overlay
      await page.keyboard.press('Escape');
    }

    // Wait for animation
    await page.waitForTimeout(300);

    // Cart drawer should be hidden
    await expect(cartDrawer).not.toBeVisible();
  });

  test('should proceed to checkout from cart', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Click product card to go to detail page
    await clickElement(page, '[data-testid="product-card"]');
    await page.waitForLoadState('networkidle');

    // Add product to cart
    await clickElement(page, '[data-testid="add-to-cart-button"]');
    await page.waitForTimeout(500);

    // Open cart drawer
    await clickElement(page, '[data-testid="cart-button"]');

    // Cart drawer should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Click checkout button
    await clickElement(page, '[data-testid="checkout-button"]');

    // Should navigate to checkout page
    await expect(page).toHaveURL(/\/checkout/);

    // Verify checkout page loaded
    await expect(page.locator('h1')).toBeVisible();
  });
});
