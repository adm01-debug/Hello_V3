import { test, expect } from '@playwright/test';

test.describe('Reports E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reports');
  });

  test('should display reports page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Reports');
  });

  test('should generate sales report', async ({ page }) => {
    await page.click('button:has-text("Generate Report")');
    await page.selectOption('select[name="reportType"]', 'sales');
    await page.fill('input[name="startDate"]', '2025-01-01');
    await page.fill('input[name="endDate"]', '2025-12-31');
    await page.click('button:has-text("Generate")');

    await expect(page.locator('.report-result')).toBeVisible();
  });

  test('should export report to PDF', async ({ page }) => {
    await page.click('button:has-text("Generate Report")');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export PDF")');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('should export report to CSV', async ({ page }) => {
    await page.click('button:has-text("Generate Report")');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export CSV")');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should filter report data', async ({ page }) => {
    await page.fill('input[name="filter"]', 'Product A');
    await page.press('input[name="filter"]', 'Enter');

    await expect(page.locator('.report-row')).toContainText('Product A');
  });

  test('should sort report columns', async ({ page }) => {
    await page.click('th:has-text("Date")');
    
    const dates = await page.locator('.report-row .date').allTextContents();
    expect(dates).toEqual([...dates].sort());
  });
});
