import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('dashboard should match snapshot', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveScreenshot('dashboard.png');
  });
  
  test('call details should match snapshot', async ({ page }) => {
    await page.goto('/calls/1');
    await expect(page).toHaveScreenshot('call-details.png');
  });
});
