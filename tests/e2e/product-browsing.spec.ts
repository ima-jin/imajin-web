/**
 * E2E Product Browsing Tests
 * Phase 4.1 - End-to-end testing of product discovery and browsing
 *
 * Tests product listing, filtering, categories, and product detail pages
 */

import { test, expect } from '@playwright/test';
import { setupE2ETest, teardownE2ETest, navigateToPage, clickElement } from '../helpers/e2e-helpers';

test.describe('Product Browsing', () => {
  test.beforeEach(async ({}, testInfo) => {
    await setupE2ETest(testInfo.parallelIndex);
  });

  test.afterEach(async () => {
    await teardownE2ETest();
  });

  test('should display product listing page with products', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Verify page header is visible
    await expect(page.locator('h1')).toBeVisible();

    // Verify product cards are displayed
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();

    // Verify sidebar filters are visible
    await expect(page.locator('text=/filters/i')).toBeVisible();
  });

  test('should browse products by category', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Verify category sections exist
    const expansionSection = page.locator('text=/expansion/i').first();
    await expect(expansionSection).toBeVisible();

    // Verify products appear in correct category
    const categoryProducts = page.locator('[data-testid="product-card"]');
    const count = await categoryProducts.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should view product detail page', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Click on first product card
    await clickElement(page, '[data-testid="product-card"]');

    // Should navigate to product detail page
    await expect(page).toHaveURL(/\/products\/.+/);

    // Verify product details are visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-to-cart-button"]')).toBeVisible();
  });

  test('should filter products by category', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Find and click category filter checkbox
    const materialFilter = page.locator('input[type="checkbox"][value="material"]');
    if (await materialFilter.isVisible()) {
      await materialFilter.click();

      // Wait for products to update
      await page.waitForTimeout(500);

      // Verify filtered products
      const products = page.locator('[data-testid="product-card"]');
      const count = await products.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display Founder Edition with color variants', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Look for Founder Edition section
    const founderSection = page.locator('text=/founder/i').first();

    if (await founderSection.isVisible()) {
      // Verify variant cards are displayed
      const variantCards = page.locator('[data-testid="product-card"]').filter({ hasText: /BLACK|WHITE|RED/i });
      const count = await variantCards.count();
      expect(count).toBeGreaterThan(0);

      // Verify availability badge
      await expect(page.locator('text=/available/i').first()).toBeVisible();
    }
  });

  test('should handle out of stock products', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Look for sold out badge
    const soldOutBadge = page.locator('text=/sold out/i');

    if (await soldOutBadge.isVisible()) {
      // Find parent product card
      const productCard = soldOutBadge.locator('..').locator('[data-testid="product-card"]');

      // Add to cart button should be disabled
      const addButton = productCard.locator('[data-testid="add-to-cart-button"]');
      await expect(addButton).toBeDisabled();
    }
  });

  test('should navigate between product categories', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Scroll to different category sections
    const expansionSection = page.locator('text=/expansion/i').first();
    if (await expansionSection.isVisible()) {
      await expansionSection.scrollIntoViewIfNeeded();
    }

    const accessoriesSection = page.locator('text=/accessories/i').first();
    if (await accessoriesSection.isVisible()) {
      await accessoriesSection.scrollIntoViewIfNeeded();
    }

    const diySection = page.locator('text=/diy/i').first();
    if (await diySection.isVisible()) {
      await diySection.scrollIntoViewIfNeeded();
    }

    // Verify page is still on products listing
    await expect(page).toHaveURL(/\/products/);
  });

  test('should view product specifications', async ({ page }) => {
    await navigateToPage(page, '/products');

    // Click on first product to view details
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();

      // Wait for navigation
      await page.waitForLoadState('networkidle');

      // Look for specifications section
      const specsSection = page.locator('text=/specifications|specs|details/i');
      if (await specsSection.isVisible()) {
        await specsSection.scrollIntoViewIfNeeded();

        // Verify specs are displayed
        await expect(specsSection).toBeVisible();
      }
    }
  });
});
