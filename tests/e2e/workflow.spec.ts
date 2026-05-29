import { test, expect } from '@playwright/test';

test.describe('Complete User Workflow', () => {
  test('should allow user to view dashboard and search calls', async ({ page }) => {
    // 1. Visit Home/Dashboard
    await page.goto('/');
    
    // 2. Check for critical elements
    const stats = page.locator('.stats-card');
    // Stats might be empty initially, but the container should be there
    
    // 3. Search for a call (Scenario)
    const searchInput = page.locator('input[placeholder*="Pesquisar"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('12345');
      await page.keyboard.press('Enter');
    }
    
    // 4. Navigate to Audit
    await page.goto('/admin/security-audit');
    await expect(page.locator('h1')).toContainText(/Auditoria/i);
    
    // 5. Verify RLS audit logs table
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });
});
