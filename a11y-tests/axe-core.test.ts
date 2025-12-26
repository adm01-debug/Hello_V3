import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility Tests with axe-core', () => {
  test('should have no accessibility violations on homepage', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
    await checkA11y(page);
  });

  test('should have no violations on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await injectAxe(page);
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
    await checkA11y(page, null, {
      rules: {
        'aria-required-attr': { enabled: true },
        'aria-valid-attr': { enabled: true },
      },
    });
  });
});
