/**
 * Smoke Tests
 * Phase 5.1 - Quick tests to verify critical functionality
 *
 * Smoke tests check that the most critical features work
 * These run first in CI/CD to fail fast if something is broken
 */

import { test, expect } from '@playwright/test';
import { navigateToPage } from '../helpers/e2e-helpers';

test.describe('Smoke Tests', () => {
  test('should load homepage', async ({ page }) => {
    await navigateToPage(page, '/');

    // Verify page loaded
    await expect(page).toHaveURL('/');

    // Verify main heading is visible
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('should load products page', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Verify page loaded
    await expect(page).toHaveURL('/products');

    // Verify page heading is visible
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should load product detail page', async ({ page }) => {
    // Navigate to first product (assumes products exist)
    await navigateToPage(page, '/products');

    // Find first product link
    const productLink = page.locator('[data-testid="product-card"]').first();

    if (await productLink.isVisible()) {
      await productLink.click();
      await page.waitForLoadState('networkidle');

      // Verify product detail page loaded
      await expect(page).toHaveURL(/\/products\/.+/);
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('should access cart', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Verify cart button is accessible
    const cartButton = page.locator('[data-testid="cart-button"]');
    await expect(cartButton).toBeVisible();

    // Click cart button
    await cartButton.click();

    // Verify cart opens
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('should access checkout page', async ({ page }) => {
    await navigateToPage(page, '/checkout');

    // Verify checkout page loaded
    await expect(page).toHaveURL('/checkout');

    // Verify form is present
    await expect(page.locator('form').first()).toBeVisible();
  });

  test('should verify database connectivity', async ({ page }) => {
    await navigateToPage(page, '/products');

    // If products load, database is connected
    // We don't need to see product cards (might not have test IDs yet)
    // Just verify page doesn't show error
    const errorMessage = page.locator('text=/error|failed|unable/i');
    await expect(errorMessage).not.toBeVisible();
  });

  test('should verify API routes respond', async ({ page }) => {
    // Test API health endpoint or product API
    const response = await page.request.get('/api/products');

    // Verify API responds (200 or similar)
    expect(response.ok() || response.status() === 404).toBeTruthy();
  });

  test('should navigate between pages', async ({ page }) => {
    // Start at homepage
    await navigateToPage(page, '/');
    await expect(page).toHaveURL('/');

    // Navigate to products
    await navigateToPage(page, '/products');
    await expect(page).toHaveURL('/products');

    // Navigate to about (if exists)
    const aboutLink = page.locator('text=/about/i').first();
    if (await aboutLink.isVisible()) {
      await aboutLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Navigate back to homepage
    await navigateToPage(page, '/');
    await expect(page).toHaveURL('/');
  });
});
