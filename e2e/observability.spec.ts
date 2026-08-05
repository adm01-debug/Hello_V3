import { test, expect } from '@playwright/test';

test.describe('Observability Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'testpassword123');
    await page.getByRole('button', { name: /entrar|login|sign in/i }).click();
    await page.waitForURL('/', { timeout: 15000 });
  });

  test('should display observability page', async ({ page }) => {
    await page.goto('/observability');
    await expect(page.getByText(/Observabilidade/i)).toBeVisible({ timeout: 10000 });
  });

  test('should display Web Vitals cards', async ({ page }) => {
    await page.goto('/observability');
    await expect(page.getByText(/LCP|FCP|CLS|TTFB/)).toBeVisible({ timeout: 10000 });
  });

  test('should display health check results', async ({ page }) => {
    await page.goto('/observability');
    await page.getByRole('tab', { name: /Health/i }).click();
    await expect(page.getByText(/Database|Auth|Storage/)).toBeVisible({ timeout: 10000 });
  });

  test('should refresh data on button click', async ({ page }) => {
    await page.goto('/observability');
    await page.getByRole('button', { name: /Atualizar/i }).click();
    // Should not crash
    await expect(page.getByText(/Observabilidade/i)).toBeVisible();
  });
});
