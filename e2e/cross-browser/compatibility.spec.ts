import { test, expect } from '@playwright/test';

test.describe('Cross-Browser Tests', () => {
  test.describe.configure({ mode: 'parallel' });

  test('should work in Chrome', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Hello/);
  });

  test('should work in Firefox', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Hello/);
  });

  test('should work in Safari', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Hello/);
  });

  test('should handle flexbox in all browsers', async ({ page }) => {
    await page.goto('/dashboard');
    const grid = page.locator('.dashboard-grid');
    await expect(grid).toBeVisible();
  });
});
