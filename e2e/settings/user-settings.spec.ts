import { test, expect } from '@playwright/test';

test.describe('User Settings E2E', () => {
  test('should update profile', async ({ page }) => {
    await page.goto('/settings');
    await page.fill('input[name="name"]', 'New Name');
    await page.fill('input[name="email"]', 'new@email.com');
    await page.click('button:has-text("Save")');
    
    await expect(page.locator('.success-toast')).toBeVisible();
  });

  test('should change password', async ({ page }) => {
    await page.goto('/settings');
    await page.click('text=Security');
    await page.fill('input[name="currentPassword"]', 'old123');
    await page.fill('input[name="newPassword"]', 'new456');
    await page.fill('input[name="confirmPassword"]', 'new456');
    await page.click('button:has-text("Update Password")');
    
    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('should toggle notifications', async ({ page }) => {
    await page.goto('/settings');
    await page.click('text=Notifications');
    await page.click('input[name="emailNotifications"]');
    
    await expect(page.locator('input[name="emailNotifications"]')).toBeChecked();
  });
});
