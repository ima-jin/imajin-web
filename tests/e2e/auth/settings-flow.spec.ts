import { test, expect } from '@playwright/test';

test.describe('Ory Settings Flow', () => {
  const testEmail = `e2e-settings-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'E2E Settings Test User';

  // Create and login test user before each test
  test.beforeEach(async ({ page }) => {
    // Register
    await page.goto('/auth/signup');
    await page.waitForSelector('input[name="traits.email"]');
    await page.fill('input[name="traits.name"]', testName);
    await page.fill('input[name="traits.email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/account', { timeout: 10000 });
  });

  test('access settings page', async ({ page }) => {
    // Navigate to settings
    await page.goto('/auth/settings');

    // Should load Ory settings form
    await page.waitForSelector('input[name="traits.name"]', { timeout: 10000 });

    // Should show current user data
    const nameInput = page.locator('input[name="traits.name"]');
    await expect(nameInput).toHaveValue(testName);
  });

  test('update profile information', async ({ page }) => {
    await page.goto('/auth/settings');

    await page.waitForSelector('input[name="traits.name"]');

    // Update name
    const newName = 'Updated Name';
    await page.fill('input[name="traits.name"]', newName);

    // Submit form
    await page.click('button[type="submit"]:has-text("Save")');

    // Should see success message
    await expect(
      page.locator('text=/updated|saved|success/i')
    ).toBeVisible({ timeout: 5000 });

    // Verify name updated
    await page.reload();
    await page.waitForSelector('input[name="traits.name"]');
    const nameInput = page.locator('input[name="traits.name"]');
    await expect(nameInput).toHaveValue(newName);
  });

  test('change password', async ({ page }) => {
    await page.goto('/auth/settings');

    await page.waitForSelector('input[name="password"]', { timeout: 10000 });

    const newPassword = 'NewPassword456!';

    // Fill password change form
    await page.fill('input[name="password"]', newPassword);

    // Submit
    await page.click('button[type="submit"]:has-text("Change Password")');

    // Should see success message
    await expect(
      page.locator('text=/password.*changed|password.*updated|success/i')
    ).toBeVisible({ timeout: 5000 });

    // Verify can login with new password
    await page.goto('/auth/signin');
    await page.waitForSelector('input[name="identifier"]');
    await page.fill('input[name="identifier"]', testEmail);
    await page.fill('input[name="password"]', newPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/account', { timeout: 10000 });
  });

  // MFA setup test (may require QR code scanning simulation)
  test.skip('setup TOTP MFA (requires QR implementation)', async ({ page }) => {
    // This test is skipped because MFA setup requires:
    // 1. QR code generation by Ory
    // 2. TOTP token generation (can use library like otplib)
    // 3. Token submission

    await page.goto('/auth/settings');

    // Look for MFA/TOTP section
    await page.waitForSelector('text=/two.*factor|totp|authenticator/i');

    // Click to enable MFA
    await page.click('button:has-text("Enable")');

    // Ory shows QR code
    await page.waitForSelector('img[alt*="QR"]');

    // Extract TOTP secret from QR or page
    // Generate TOTP code
    // Enter code
    // Verify MFA enabled
  });
});
