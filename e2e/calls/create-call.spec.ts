import { test, expect } from '@playwright/test';

test.describe('Create Call E2E', () => {
  test('should create new call', async ({ page }) => {
    await page.goto('/calls/new');
    await page.fill('input[name="phoneNumber"]', '+5511999999999');
    await page.fill('input[name="contactName"]', 'Test Contact');
    await page.click('button[type="submit"]');
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page).toHaveURL(/\/calls\/\d+/);
  });
});
