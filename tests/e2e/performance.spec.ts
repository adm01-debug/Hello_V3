import { test, expect } from '@playwright/test';
import { seedAdminSession } from './helpers/adminSession';

test.describe('Dashboard Performance and Lists', () => {
  test('should render call lists efficiently', async ({ page, context }) => {
    // Tenta seedar uma sessão admin real (via E2E_ADMIN_EMAIL/PASSWORD ou
    // E2E_SUPABASE_SESSION_JSON). Se indisponível, o teste é auto-skipped.
    const seeded = await seedAdminSession(context, page);
    // Navigating to a page with large lists
    await page.goto('/calls');

    if (!seeded && /\/(auth|login)/.test(page.url())) {
      test.skip(true, 'Rota protegida — configure E2E_ADMIN_EMAIL/PASSWORD para executar.');
      return;
    }

    // Check if virtualized list is present (if applicable)
    const list = page.locator('[role="list"]');
    await expect(list).toBeVisible();
    
    // Measure time to first meaningful paint or similar
    const startTime = Date.now();
    await page.waitForSelector('.call-item', { timeout: 5000 }).catch(() => {});
    const endTime = Date.now();
    
    console.log(`Call list render time: ${endTime - startTime}ms`);
    expect(endTime - startTime).toBeLessThan(2000);
  });
});

test.describe('Edge Function Resilience', () => {
  test('should handle rapid requests to analyze-call', async ({ request }) => {
    const promises = Array.from({ length: 10 }, () => 
      request.post('/functions/v1/analyze-call', {
        data: { transcript: "Test transcript", callInfo: { phone: "123" } }
      })
    );
    
    const responses = await Promise.all(promises);
    const statuses = responses.map(r => r.status());
    
    // We expect some 429s if rate limiting is tight, or 200s if within limits
    expect(statuses.every(s => s === 200 || s === 429)).toBe(true);
  });
});
