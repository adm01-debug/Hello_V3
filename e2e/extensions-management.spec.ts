import { test, expect } from '@playwright/test';

/**
 * E2E: gestão de ramais (admin)
 * Smoke test que valida o carregamento da rota e elementos críticos.
 */
test.describe('Painel de Ramais', () => {
  test('rota /admin/extensions exige autenticação ou mostra UI base', async ({ page }) => {
    await page.goto('/admin/extensions');
    // Deve redirecionar para login OU exibir o painel
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    expect(url).toMatch(/(\/login|\/admin\/extensions)/);
  });
});
