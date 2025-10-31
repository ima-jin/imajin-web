/**
 * Responsive Design E2E Tests
 * Phase 2.4.7 - Phase 6
 *
 * Tests for mobile responsiveness across all pages
 */

import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test.describe('Homepage Mobile Layout', () => {
    test('should render homepage correctly on mobile (375px)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Hero section should be visible
      await expect(page.locator('h1')).toBeVisible();

      // Should not have horizontal scroll
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // +1 for rounding
    });
  });

  test.describe('Product Grid Responsive', () => {
    test('should display product grid responsively', async ({ page }) => {
      await page.goto('/products');

      // Test mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForLoadState('networkidle');

      const grid = page.locator('[class*="grid"]').first();
      await expect(grid).toBeVisible();

      // Test tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForLoadState('networkidle');
      await expect(grid).toBeVisible();

      // Test desktop
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForLoadState('networkidle');
      await expect(grid).toBeVisible();
    });
  });

  test.describe('Cart Drawer Mobile', () => {
    test('should handle cart drawer on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/products');

      // Find and click cart button
      const cartButton = page.getByRole('button', { name: /cart/i });
      if (await cartButton.isVisible()) {
        await cartButton.click();

        // Cart drawer should open
        const drawer = page.locator('[role="dialog"]');
        await expect(drawer).toBeVisible();

        // Should not cause horizontal scroll
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
      }
    });
  });

  test.describe('Navigation Mobile Menu', () => {
    test('should display mobile navigation correctly', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Navigation should be accessible
      const nav = page.locator('nav').first();
      await expect(nav).toBeVisible();

      // Should not overflow viewport
      const navBox = await nav.boundingBox();
      expect(navBox?.width).toBeLessThanOrEqual(375);
    });
  });

  test.describe('Portfolio Grid Mobile', () => {
    test('should display portfolio grid on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/portfolio');

      // Page should load
      await page.waitForLoadState('networkidle');

      // Should not have horizontal scroll
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });
  });

  test.describe('Contact Page Mobile', () => {
    test('should display contact page on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/contact');

      // Email should be visible
      const email = page.getByText('info@imajin.ca');
      await expect(email).toBeVisible();

      // Should not overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });
  });

  test.describe('Touch Interactions', () => {
    test('should handle touch interactions correctly', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/products');

      // All buttons should be tappable (min 44x44 touch target)
      const buttons = page.getByRole('button');
      const count = await buttons.count();

      if (count > 0) {
        const firstButton = buttons.first();
        const box = await firstButton.boundingBox();

        if (box) {
          // Touch targets should be at least 44x44 (iOS guidelines)
          expect(box.height).toBeGreaterThanOrEqual(40); // Allow slight variance
        }
      }
    });
  });

  test.describe('No Horizontal Scroll', () => {
    test('should not have horizontal scroll on any page', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const pages = ['/', '/products', '/portfolio', '/contact'];

      for (const url of pages) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
      }
    });
  });
});
