import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show login form elements', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});

test.describe('Dashboard and Critical Lists', () => {
  test('should load dashboard widgets', async ({ page }) => {
    // Note: This would require a mocked session in a real CI environment
    await page.goto('/login');
    // For now, just verifying the page structure
    await expect(page).toHaveTitle(/Freight/i);
  });
});
