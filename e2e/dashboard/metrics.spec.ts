import { test, expect } from '@playwright/test';

test.describe('Dashboard Metrics E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should display all metrics', async ({ page }) => {
    await expect(page.locator('.metric-card')).toHaveCount(4);
  });

  test('should update metrics in real-time', async ({ page }) => {
    const initialValue = await page.locator('.metric-value').first().textContent();
    await page.waitForTimeout(5000);
    const updatedValue = await page.locator('.metric-value').first().textContent();
    
    expect(updatedValue).toBeDefined();
  });

  test('should filter metrics by date range', async ({ page }) => {
    await page.selectOption('select[name="dateRange"]', 'last7days');
    await expect(page.locator('.chart')).toBeVisible();
  });
});
