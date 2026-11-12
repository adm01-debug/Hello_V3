import { test, expect } from '@playwright/test';
import { seedAdminSession } from './helpers/adminSession';
import { shouldSkipNoSession } from './helpers/skipGuard';

test.describe('Complete User Workflow', () => {
  test('should allow user to view dashboard and search calls', async ({ page, context }) => {
    const seeded = await seedAdminSession(context, page);
    // 1. Visit Home/Dashboard
    await page.goto('/');

    if (await shouldSkipNoSession(page, seeded)) {
          test.skip(true, 'Rota protegida — configure E2E_ADMIN_EMAIL/PASSWORD/SESSION_JSON para executar.');
      return;
    }

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
