import { test, expect } from '@playwright/test';

test.describe('Ory Registration Flow', () => {
  const testEmail = `e2e-reg-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'E2E Test User';

  test('complete registration flow', async ({ page }) => {
    // Navigate to signup page (initializes Ory registration flow)
    await page.goto('/auth/signup');

    // Wait for Ory form to load
    await page.waitForSelector('input[name="traits.email"]', { timeout: 10000 });

    // Fill in Ory self-service registration form
    await page.fill('input[name="traits.name"]', testName);
    await page.fill('input[name="traits.email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to account page after successful registration
    await expect(page).toHaveURL('/account', { timeout: 10000 });

    // Should see welcome message with user name
    await expect(page.locator(`text=/Welcome.*${testName}/i`)).toBeVisible();
  });

  test('reject weak password', async ({ page }) => {
    await page.goto('/auth/signup');

    await page.waitForSelector('input[name="traits.email"]');

    await page.fill('input[name="traits.name"]', testName);
    await page.fill('input[name="traits.email"]', `weak-pw-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'weak'); // Too short

    await page.click('button[type="submit"]');

    // Should see error from Ory about password requirements
    await expect(
      page.locator('text=/password.*too short|password.*at least|minimum.*characters/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('reject invalid email format', async ({ page }) => {
    await page.goto('/auth/signup');

    await page.waitForSelector('input[name="traits.email"]');

    await page.fill('input[name="traits.name"]', testName);
    await page.fill('input[name="traits.email"]', 'invalid-email'); // No @ or domain
    await page.fill('input[name="password"]', testPassword);

    await page.click('button[type="submit"]');

    // Should see error from Ory about email format
    await expect(
      page.locator('text=/invalid.*email|email.*format|valid.*email/i')
    ).toBeVisible({ timeout: 5000 });
  });
});
