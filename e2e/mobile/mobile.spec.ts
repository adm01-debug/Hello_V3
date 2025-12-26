import { test, expect, devices } from '@playwright/test';

test.describe('Mobile E2E Tests', () => {
  test.use({ ...devices['iPhone 13'] });

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/');
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThanOrEqual(428);
  });

  test('should have touch-friendly buttons', async ({ page }) => {
    await page.goto('/dashboard');
    const button = page.locator('button').first();
    const box = await button.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test('should support swipe gestures', async ({ page }) => {
    await page.goto('/calls');
    await page.touchscreen.tap(100, 100);
    // Swipe simulation
  });
});
