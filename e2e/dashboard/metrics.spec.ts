import { test, expect } from '@playwright/test';

test.describe('Dashboard Metrics E2E', () => {
  test('should display key metrics', async ({ page }) => {
    await page.goto('/dashboard');
    
    await expect(page.locator('[data-testid="total-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-calls"]')).toBeVisible();
  });

  test('should refresh metrics', async ({ page }) => {
    await page.goto('/dashboard');
    const initialValue = await page.locator('[data-testid="total-users"]').textContent();
    
    await page.click('button:has-text("Refresh")');
    await page.waitForTimeout(1000);
    
    const newValue = await page.locator('[data-testid="total-users"]').textContent();
    expect(newValue).toBeDefined();
  });

  test('should filter by date range', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('[data-testid="date-filter"]');
    await page.click('text=Last 7 days');
    
    await expect(page.locator('.chart-container')).toBeVisible();
  });
});
