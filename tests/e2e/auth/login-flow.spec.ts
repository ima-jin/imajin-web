import { test, expect } from '@playwright/test';

test.describe('Ory Login Flow', () => {
  const testEmail = `e2e-login-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'E2E Login Test User';

  // Create test user before running tests
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/auth/signup');
    await page.waitForSelector('input[name="traits.email"]');
    await page.fill('input[name="traits.name"]', testName);
    await page.fill('input[name="traits.email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/account', { timeout: 10000 });
    await page.close();
  });

  test('successful login flow', async ({ page }) => {
    // Navigate to signin page
    await page.goto('/auth/signin');

    // Wait for Ory login form
    await page.waitForSelector('input[name="identifier"]', { timeout: 10000 });

    // Fill in login credentials
    await page.fill('input[name="identifier"]', testEmail);
    await page.fill('input[name="password"]', testPassword);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to account page
    await expect(page).toHaveURL('/account', { timeout: 10000 });

    // Should see user name
    await expect(page.locator(`text=/Welcome.*${testName}/i`)).toBeVisible();
  });

  test('reject incorrect password', async ({ page }) => {
    await page.goto('/auth/signin');

    await page.waitForSelector('input[name="identifier"]');

    await page.fill('input[name="identifier"]', testEmail);
    await page.fill('input[name="password"]', 'WrongPassword123!');

    await page.click('button[type="submit"]');

    // Should see error from Ory
    await expect(
      page.locator('text=/incorrect.*password|invalid.*credentials|authentication.*failed/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('reject non-existent user', async ({ page }) => {
    await page.goto('/auth/signin');

    await page.waitForSelector('input[name="identifier"]');

    await page.fill('input[name="identifier"]', `nonexistent-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testPassword);

    await page.click('button[type="submit"]');

    // Should see error from Ory
    await expect(
      page.locator('text=/incorrect.*password|invalid.*credentials|authentication.*failed/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('protected route redirects to signin', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/account/orders');

    // Should redirect to signin
    await expect(page).toHaveURL(/\/auth\/signin/, { timeout: 10000 });
  });

  test('sign out flow', async ({ page }) => {
    // First, sign in
    await page.goto('/auth/signin');
    await page.waitForSelector('input[name="identifier"]');
    await page.fill('input[name="identifier"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/account');

    // Find and click sign out button (implementation depends on UI)
    // This is a placeholder - adjust selector based on actual implementation
    await page.click('[data-testid="user-menu"]').catch(() => {
      // Fallback if data-testid not implemented yet
      page.click('button:has-text("Sign Out")');
    });

    // Should redirect to home or signin page
    await expect(page).toHaveURL(/\/(auth\/signin)?$/, { timeout: 5000 });
  });
});
