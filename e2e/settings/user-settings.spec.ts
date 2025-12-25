import { test, expect } from '@playwright/test';

test.describe('Settings E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test('should display settings page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Settings');
  });

  test('should update profile information', async ({ page }) => {
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@test.com');
    await page.click('button:has-text("Save")');

    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('should change password', async ({ page }) => {
    await page.click('text=Security');
    await page.fill('input[name="currentPassword"]', 'oldpass123');
    await page.fill('input[name="newPassword"]', 'newpass123');
    await page.fill('input[name="confirmPassword"]', 'newpass123');
    await page.click('button:has-text("Change Password")');

    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('should update notification preferences', async ({ page }) => {
    await page.click('text=Notifications');
    await page.check('input[name="emailNotifications"]');
    await page.uncheck('input[name="pushNotifications"]');
    await page.click('button:has-text("Save Preferences")');

    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('should toggle dark mode', async ({ page }) => {
    await page.click('text=Appearance');
    await page.click('button:has-text("Dark Mode")');

    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('should manage API keys', async ({ page }) => {
    await page.click('text=API Keys');
    await page.click('button:has-text("Generate New Key")');

    await expect(page.locator('.api-key')).toBeVisible();
  });
});
