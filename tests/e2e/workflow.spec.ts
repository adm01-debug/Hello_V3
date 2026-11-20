import { test, expect } from '@playwright/test';
import { seedAdminSession } from './helpers/adminSession';
import { shouldSkipNoSession } from './helpers/skipGuard';

test.describe('Complete User Workflow', () => {
  test('should allow user to view dashboard and search calls', async ({ page, context }) => {
    const seeded = await seedAdminSession(context, page);
    // 1. Visit Home/Dashboard
    await page.goto('/dashboard');

    if (await shouldSkipNoSession(page, seeded)) {
          test.skip(true, 'Rota protegida — configure E2E_ADMIN_EMAIL/PASSWORD/SESSION_JSON para executar.');
      return;
    }

    // 2. Check for critical elements
    const stats = page.locator('main[aria-label="Dashboard principal"]');
    await expect(stats).toBeVisible();
    const statCards = page.locator('[role="article"]');
    await expect(statCards.first()).toBeVisible();
    
    // 4. Navigate to Audit
    await page.goto('/admin/security-audit');
    await expect(page.locator('h1')).toContainText(/Auditoria/i);
    
    // 5. Verify RLS audit logs table
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });
});
