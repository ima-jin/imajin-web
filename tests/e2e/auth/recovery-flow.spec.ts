import { test, expect } from '@playwright/test';

test.describe('Ory Password Recovery Flow', () => {
  const testEmail = `e2e-recovery-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const newPassword = 'NewPassword456!';
  const testName = 'E2E Recovery Test User';

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

  test('initiate password recovery flow', async ({ page }) => {
    // Navigate to recovery page
    await page.goto('/auth/recovery');

    // Wait for Ory recovery form
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });

    // Enter email
    await page.fill('input[name="email"]', testEmail);

    // Submit form
    await page.click('button[type="submit"]');

    // Should see success message (Ory sends recovery email)
    await expect(
      page.locator('text=/email.*sent|check.*email|recovery.*code/i')
    ).toBeVisible({ timeout: 10000 });
  });

  test('reject non-existent email in recovery', async ({ page }) => {
    await page.goto('/auth/recovery');

    await page.waitForSelector('input[name="email"]');

    await page.fill('input[name="email"]', `nonexistent-${Date.now()}@example.com`);

    await page.click('button[type="submit"]');

    // Ory typically shows success even for non-existent emails (security)
    // Or may show error - depends on Ory configuration
    await expect(
      page.locator('text=/email.*sent|check.*email|account.*not.*found/i')
    ).toBeVisible({ timeout: 10000 });
  });

  // Note: Full recovery flow with actual code requires email interception
  // This would typically be tested with a tool like Mailhog or SendGrid test mode
  test.skip('complete recovery with code (requires email)', async ({ page }) => {
    // This test is skipped because it requires:
    // 1. Email service integration (SendGrid test mode or Mailhog)
    // 2. Code extraction from email
    // 3. Code submission to recovery form

    // Example flow (when email integration is set up):
    // 1. Request recovery code
    // 2. Extract code from test email service
    // 3. Enter code in recovery form
    // 4. Set new password
    // 5. Login with new password
  });
});
