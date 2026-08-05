import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: /entrar|login|sign in/i }).click();
    // Should show validation feedback
    await expect(page.locator('input[type="email"]:invalid, [aria-invalid="true"]').first()).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword123');
    await page.getByRole('button', { name: /entrar|login|sign in/i }).click();
    
    // Should display error toast or message
    await expect(page.locator('[role="alert"], [data-sonner-toast]').first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to register page', async ({ page }) => {
    await page.getByRole('link', { name: /cadastr|register|sign up/i }).click();
    await expect(page).toHaveURL(/register/);
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.getByRole('link', { name: /esquec|forgot/i }).click();
    await expect(page).toHaveURL(/forgot/);
  });

  test('should show Google OAuth button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
  });
});
