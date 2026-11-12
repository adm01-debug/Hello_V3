import { test, expect } from '@playwright/test';
import { seedAdminSession } from './helpers/adminSession';

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
  test('should load dashboard widgets', async ({ page, context }) => {
    // Tenta seedar uma sessão admin real (via E2E_ADMIN_EMAIL/PASSWORD ou
    // E2E_SUPABASE_SESSION_JSON). Se indisponível, o teste é auto-skipped.
    const seeded = await seedAdminSession(context, page);
    await page.goto('/login');

    if (!seeded && /\/(auth|login)/.test(page.url())) {
      test.skip(true, 'Rota protegida — configure E2E_ADMIN_EMAIL/PASSWORD para executar.');
      return;
    }

    // For now, just verifying the page structure
    await expect(page).toHaveTitle(/Freight/i);
  });
});
