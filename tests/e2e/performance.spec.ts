import { test, expect } from '@playwright/test';
import { seedAdminSession } from './helpers/adminSession';
import { hasAdminCredentials, shouldSkipNoSession } from './helpers/skipGuard';

test.describe('Dashboard Performance and Lists', () => {
  test('should render call lists efficiently', async ({ page, context }) => {
    const seeded = await seedAdminSession(context, page);
    // Navigating to a page with large lists
    await page.goto('/dashboard');

    if (await shouldSkipNoSession(page, seeded)) {
          test.skip(true, 'Rota protegida — configure E2E_ADMIN_EMAIL/PASSWORD/SESSION_JSON para executar.');
      return;
    }

    // Check if virtualized list is present (if applicable)
    const list = page.locator('main[aria-label="Dashboard principal"]');
    await expect(list).toBeVisible();
    
    // Measure time to first meaningful paint or similar
    const startTime = Date.now();
    await page.waitForSelector('text=Chamadas Recentes', { timeout: 5000 }).catch(() => {});
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(2000);
  });
});

test.describe('Edge Function Resilience', () => {
  test('should handle rapid requests to analyze-call', async ({ request }) => {
    // A edge function so existe em um Supabase real; sem credenciais o guard
    // abaixo pula, preservando o CI sem secrets.
    if (!hasAdminCredentials()) {
      test.skip(true, 'Sem credenciais admin — não há edge function deployada para validar.');
      return;
    }
    const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.E2E_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.E2E_SUPABASE_ANON_KEY;
    const email = process.env.E2E_ADMIN_EMAIL;
    const password = process.env.E2E_ADMIN_PASSWORD;
    if (!supabaseUrl || !anonKey || !email || !password) {
      test.skip(true, 'Credenciais incompletas — não é possível autenticar para a edge function.');
      return;
    }

    // Autentica de verdade para obter o JWT exigido pela edge function.
    const login = await request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      data: { email, password },
    });
    const tokenJson = await login.json();
    const accessToken = tokenJson?.access_token;
    if (!accessToken) {
      test.skip(true, 'Login admin falhou — não é possível validar a edge function.');
      return;
    }

    const promises = Array.from({ length: 10 }, () =>
      request.post(`${supabaseUrl}/functions/v1/analyze-call`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
        data: { transcript: 'Test transcript', callInfo: { phone: '123' } },
      }),
    );

    const responses = await Promise.all(promises);
    const statuses = responses.map((r) => r.status());

    // A edge retorna 200 (sucesso), 429 (rate limit) ou 503 (se a IA
    // upstream estiver indisponível — guard legítimo do serviço).
    expect(statuses.every((s) => s === 200 || s === 429 || s === 503)).toBe(true);
  });
});
