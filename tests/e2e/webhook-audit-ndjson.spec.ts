import { test, expect } from '@playwright/test';
import { seedAdminSession } from './helpers/adminSession';

/**
 * Cobre o fluxo de auditoria do webhook de exportação em Segurança > Alertas:
 * 1. Abertura do diálogo "Configurar webhook…" via menu de ações
 * 2. Expansão de uma entrada do histórico revelando a trilha de tentativas
 * 3. Download do histórico em NDJSON
 *
 * O histórico é semeado no localStorage antes da navegação para tornar o teste
 * determinístico e independente do backend.
 */

const STORAGE_KEY = 'security-alerts:webhook-history:v1';

const seededEntry = {
  id: 'e2e-entry-1',
  at: new Date('2026-07-12T12:00:00Z').toISOString(),
  url: 'https://example.com/webhook',
  filename: 'security-alerts-e2e.ndjson',
  format: 'ndjson',
  count: 2,
  kind: 'export',
  ok: false,
  status: 502,
  latency_ms: 812,
  attempts: 2,
  signed: true,
  request_id: 'req-e2e-001',
  error: 'Bad Gateway',
  response_headers: { 'content-type': 'text/plain' },
  response_snippet: 'upstream error',
  attempts_detail: [
    {
      attempt: 1,
      started_at: new Date('2026-07-12T12:00:00Z').toISOString(),
      duration_ms: 402,
      ok: false,
      status: 502,
      error: 'Bad Gateway',
      response_snippet: 'upstream error',
    },
    {
      attempt: 2,
      started_at: new Date('2026-07-12T12:00:01Z').toISOString(),
      duration_ms: 410,
      ok: false,
      status: 502,
      error: 'Bad Gateway',
      response_snippet: 'upstream error',
    },
  ],
};

test.describe('Webhook — auditoria e download NDJSON', () => {
  test('abre diálogo, expande tentativa e baixa NDJSON', async ({ page, context }) => {
    // Semeia o histórico antes de qualquer navegação da SPA.
    await context.addInitScript(
      ([key, value]) => {
        try {
          window.localStorage.setItem(key, value);
        } catch {
          /* ignore */
        }
      },
      [STORAGE_KEY, JSON.stringify([seededEntry])],
    );

    // Tenta seedar uma sessão admin real (via E2E_ADMIN_EMAIL/PASSWORD ou
    // E2E_SUPABASE_SESSION_JSON). Se indisponível, o teste é auto-skipped.
    const seeded = await seedAdminSession(context, page);
    await page.goto('/admin/security-alerts');

    if (!seeded && /\/(auth|login)/.test(page.url())) {
      test.skip(true, 'Rota protegida — configure E2E_ADMIN_EMAIL/PASSWORD para executar.');
      return;
    }

    // Abre menu de ações e clica em "Configurar webhook…"
    await page.getByRole('button', { name: /ações|exportar|opções/i }).first().click();
    await page.getByRole('menuitem', { name: /configurar webhook/i }).click();

    // Diálogo abre com a seção Histórico contendo a entrada semeada.
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Histórico \(1\)/i)).toBeVisible();
    await expect(dialog.getByText('security-alerts-e2e.ndjson')).toBeVisible();

    // Expande a linha da entrada.
    await dialog.getByRole('button', { name: /expandir detalhes/i }).click();
    await expect(dialog.getByText(/Trilha de tentativas \(2\)/i)).toBeVisible();
    await expect(dialog.getByText('Tentativa 1')).toBeVisible();
    await expect(dialog.getByText('Tentativa 2')).toBeVisible();

    // Dispara o download NDJSON e valida o arquivo emitido.
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      dialog.getByRole('button', { name: /^NDJSON$/ }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^webhook-history-.*\.ndjson$/);
  });
});
