import { test, expect } from '@playwright/test';

test.describe('Generate Report E2E', () => {
  test('should generate PDF report', async ({ page }) => {
    await page.goto('/reports');
    await page.click('button:has-text("Generate Report")');
    await page.selectOption('select[name="format"]', 'pdf');
    await page.click('button:has-text("Download")');
    
    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('should generate CSV report', async ({ page }) => {
    await page.goto('/reports');
    await page.click('button:has-text("Generate Report")');
    await page.selectOption('select[name="format"]', 'csv');
    await page.click('button:has-text("Download")');
    
    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('should filter report data', async ({ page }) => {
    await page.goto('/reports');
    await page.fill('input[name="startDate"]', '2024-01-01');
    await page.fill('input[name="endDate"]', '2024-12-31');
    await page.click('button:has-text("Apply Filters")');
    
    await expect(page.locator('.report-preview')).toBeVisible();
  });
});
