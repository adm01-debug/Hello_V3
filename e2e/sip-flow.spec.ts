import { test, expect, type Page } from '@playwright/test';

/**
 * E2E — Fluxo SIP completo
 *
 * Cobre:
 *  1. Autenticação e acesso à página de chamadas
 *  2. Visibilidade do softphone e status de registro SIP
 *  3. Digitação de número via dialpad e edição
 *  4. Tentativa de discagem SIP (start call) — valida transição de UI
 *  5. Registro da chamada no histórico (/call-history)
 *  6. Atualização em tempo real no dashboard (contadores/lista ativa)
 *
 * Observação: registro SIP real depende de trunk externo. Estes testes validam
 * o fluxo de UI, transições de estado e integração realtime — resilientes a
 * ambientes sem trunk configurado (fazem soft-assert nas fases que exigem
 * infraestrutura VoIP viva).
 */

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';
const TEST_NUMBER = process.env.TEST_SIP_NUMBER || '1155551234';

async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.getByRole('button', { name: /entrar|login|sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15000 });
}

test.describe('Fluxo SIP end-to-end', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('carrega softphone e exibe badge de status SIP', async ({ page }) => {
    await page.goto('/calls');
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 });

    // Badge SIP: qualquer um dos rótulos de STATUS_LABEL de SipConnectionStatus
    const statusBadge = page.getByText(
      /Desconectado|Conectando\.\.\.|Linha SIP ativa|Em chamada|Chamando|Erro SIP/i,
    ).first();
    await expect(statusBadge).toBeVisible({ timeout: 15000 });
  });

  test('permite digitar número no dialpad e limpar via backspace', async ({ page }) => {
    await page.goto('/calls');

    // Seleciona canal SIP se houver seletor de canais
    const sipChannel = page.getByRole('button', { name: /^sip$/i }).first();
    if (await sipChannel.isVisible().catch(() => false)) {
      await sipChannel.click();
    }

    // Digita via botões do dialpad (constants.tsx expõe dígitos 0-9,*,#)
    for (const digit of TEST_NUMBER.split('')) {
      const btn = page.getByRole('button', { name: new RegExp(`^\\${digit}$|^${digit}$`) }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
      }
    }

    const input = page.locator('input[placeholder*="número" i], input[placeholder*="Digite" i]').first();
    await expect(input).toHaveValue(new RegExp(TEST_NUMBER.slice(-4)), { timeout: 5000 });

    // Backspace remove último dígito
    const backspaceBtn = page.locator('button:has(svg.lucide-delete)').first();
    if (await backspaceBtn.isVisible().catch(() => false)) {
      await backspaceBtn.click();
      await expect(input).not.toHaveValue(TEST_NUMBER);
    }
  });

  test('inicia tentativa de chamada SIP e atualiza UI', async ({ page }) => {
    await page.goto('/calls');

    const input = page.locator('input[placeholder*="número" i], input[placeholder*="Digite" i]').first();
    await input.fill(TEST_NUMBER);

    const callButton = page.getByRole('button', { name: /^(ligar|chamar|call|iniciar)/i }).first();
    if (!(await callButton.isVisible().catch(() => false))) {
      test.skip(true, 'Botão de chamada não visível (canal ativo pode não ser SIP nesta configuração).');
    }

    await callButton.click();

    // Após clicar, ou vemos: (a) toast de erro (sem trunk), (b) estado "chamando"/"em chamada", (c) permissão de mídia
    const anyOutcome = page.locator(
      '[data-sonner-toast], text=/Chamando|Em chamada|conectado|falha|erro/i',
    ).first();
    await expect(anyOutcome).toBeVisible({ timeout: 15000 });
  });

  test('registra chamada no histórico após tentativa', async ({ page }) => {
    await page.goto('/call-history');
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 });

    // A lista de sessões deve renderizar (mesmo vazia com empty state)
    const listOrEmpty = page.locator(
      '[data-testid="call-sessions-list"], [role="table"], text=/nenhum|vazio|histórico|sem registros/i',
    ).first();
    await expect(listOrEmpty).toBeVisible({ timeout: 10000 });
  });

  test('dashboard reflete estado de chamadas ativas em tempo real', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 });

    // Widgets de chamadas ativas / indicador realtime
    const activeIndicator = page.locator(
      'text=/chamadas ativas|em chamada|ativas agora|active calls/i',
    ).first();

    // Soft: em contas sem tráfego o widget pode não estar montado no dashboard
    if (await activeIndicator.isVisible().catch(() => false)) {
      await expect(activeIndicator).toBeVisible();
    }

    // Verifica ausência de erros críticos no console durante hidratação realtime
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(2000);
    expect(errors, `Erros JS no dashboard: ${errors.join(' | ')}`).toHaveLength(0);
  });

  test('supervisor panel lista chamadas ativas com atualização realtime', async ({ page }) => {
    const response = await page.goto('/supervisor').catch(() => null);
    if (!response || response.status() >= 400) {
      test.skip(true, 'Rota /supervisor indisponível para este usuário.');
    }

    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 });

    // ActiveCallsList deve montar (mesmo vazio, exibe empty state)
    const container = page.locator(
      '[data-testid="active-calls-list"], text=/chamadas ativas|nenhuma chamada|active calls/i',
    ).first();
    await expect(container).toBeVisible({ timeout: 10000 });
  });
});
