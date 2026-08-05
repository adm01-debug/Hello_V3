import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  // These tests require authentication — use storage state or login fixture
  test.describe('Unauthenticated', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/');
      await page.waitForURL(/login/, { timeout: 10000 });
      await expect(page).toHaveURL(/login/);
    });
  });

  test.describe('Authenticated', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await page.goto('/login');
      await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
      await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'testpassword123');
      await page.getByRole('button', { name: /entrar|login|sign in/i }).click();
      await page.waitForURL('/', { timeout: 15000 });
    });

    test('should display stats cards', async ({ page }) => {
      await expect(page.locator('[data-testid="stats-card"], .stats-card, [class*="StatsCard"]').first()).toBeVisible({ timeout: 10000 });
    });

    test('should display sidebar navigation', async ({ page }) => {
      await expect(page.locator('nav, [role="navigation"]').first()).toBeVisible();
    });

    test('should navigate to contacts page', async ({ page }) => {
      await page.getByRole('link', { name: /contato|contact/i }).first().click();
      await expect(page).toHaveURL(/contacts/);
    });

    test('should navigate to calls page', async ({ page }) => {
      await page.getByRole('link', { name: /chamad|call/i }).first().click();
      await expect(page).toHaveURL(/calls/);
    });

    test('should display theme toggle', async ({ page }) => {
      await expect(page.locator('[aria-label*="theme"], [data-testid="theme-toggle"], button:has(svg)').first()).toBeVisible();
    });
  });
});
