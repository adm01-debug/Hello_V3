import { test, expect, type Page } from '@playwright/test';
import { seedAdminSession } from './helpers/adminSession';
import { hasAdminCredentials } from './helpers/skipGuard';

/**
 * Etapa 273 - navegacao por teclado no fluxo de chamada.
 *
 * O plano pede percorrer login -> discador -> chamada -> encerrar so com o
 * teclado e registrar onde o foco se perde, onde nao existe indicador visivel
 * e onde a ordem de tabulacao e ilogica. Nada de atalho global nesta etapa.
 *
 * Mede tres coisas no navegador de verdade:
 *  1. cada parada de Tab tem indicador visivel (outline ou box-shadow);
 *  2. nenhum elemento focado fica invisivel (1x1, sr-only sem foco);
 *  3. o Tab nunca cai no body no meio da sequencia (foco perdido).
 *
 * E o dialogo do assistente de voz, o unico modal do fluxo: abre por teclado,
 * prende o foco dentro, fecha com Esc e devolve o foco ao gatilho.
 *
 * O relatorio `RELATORIO-273` sai no stdout do runner.
 */

interface Parada {
  ordem: number;
  el: string;
  texto: string;
  indicador: boolean;
  visivel: boolean;
}

const MAX_TABS = 60;

/** Meta do plano: percorrer o fluxo com Tab/Enter/Esc, sem mouse. */
const ROTA_DISCADOR = '/';

async function lerFoco(page: Page, ordem: number): Promise<Parada | null> {
  return page.evaluate((n) => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body || el === document.documentElement) return null;
    const bruto = (el as HTMLElement).className;
    const classes =
      typeof bruto === 'string'
        ? bruto
            .trim()
            .split(/\s+/)
            .filter((c) => c && !c.includes(':'))
            .slice(0, 3)
            .join('.')
        : '';
    const estilo = getComputedStyle(el);
    const temAnel =
      (estilo.outlineStyle !== 'none' && estilo.outlineWidth !== '0px') ||
      estilo.boxShadow !== 'none';
    const caixa = el.getBoundingClientRect();
    return {
      ordem: n,
      el: `${el.tagName.toLowerCase()}${classes ? `.${classes}` : ''}`,
      texto: (el.getAttribute('aria-label') || el.textContent || '')
        .trim()
        .replace(/\s+/g, ' ')
        .slice(0, 40),
      indicador: temAnel,
      visivel: caixa.width > 0 && caixa.height > 0,
    };
  }, ordem);
}

test.describe('Etapa 273 - navegacao por teclado no fluxo de chamada', () => {
  test('percorre o discador com Tab e mede o foco', async ({ page, context }) => {
    test.setTimeout(300_000);

    const seeded = await seedAdminSession(context, page);
    await page.goto('/dashboard');
    if (!hasAdminCredentials() && !seeded) {
      test.skip(true, 'Rota protegida - configure E2E_ADMIN_EMAIL/PASSWORD/SESSION_JSON para executar.');
      return;
    }
    await page.waitForLoadState('networkidle').catch(() => undefined);
    expect(
      new URL(page.url()).pathname,
      `a sessao de admin nao autenticou: /dashboard caiu em ${page.url()}`,
    ).not.toMatch(/^\/(login|auth)/);

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(ROTA_DISCADOR, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press('Escape');

    const comTabindexPositivo = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[tabindex]'))
        .map((el) => Number(el.getAttribute('tabindex')))
        .filter((n) => n > 0),
    );
    expect(
      comTabindexPositivo,
      'tabindex positivo quebra a ordem natural de tabulacao (WCAG 2.4.3)',
    ).toEqual([]);

    const paradas: Parada[] = [];
    let semFoco = 0;
    for (let i = 0; i < MAX_TABS; i += 1) {
      await page.keyboard.press('Tab');
      const parada = await lerFoco(page, i + 1);
      if (!parada) {
        semFoco += 1;
        continue;
      }
      paradas.push(parada);
    }

    process.stdout.write(`TELA-273 ${ROTA_DISCADOR} paradas=${paradas.length} semFoco=${semFoco}\n`);
    for (const p of paradas) {
      process.stdout.write(
        `FOCO-273 ${p.ordem}\t${p.indicador ? 'anel' : 'SEM-ANEL'}\t${p.visivel ? 'visivel' : 'INVISIVEL'}\t${p.el}\t${p.texto}\n`,
      );
    }
    process.stdout.write(
      `RELATORIO-273 ${JSON.stringify({
        rota: ROTA_DISCADOR,
        paradas: paradas.length,
        elementosDistintos: new Set(paradas.map((p) => p.el)).size,
        semIndicador: paradas.filter((p) => !p.indicador),
        invisiveis: paradas.filter((p) => !p.visivel),
        semFoco,
      })}\n`,
    );

    expect(paradas.length, 'o Tab nao alcancou nenhum controle no discador').toBeGreaterThanOrEqual(8);
    expect(
      paradas.filter((p) => !p.visivel),
      'controle focavel invisivel: o teclado para onde o olho nao ve',
    ).toEqual([]);
    expect(
      paradas.filter((p) => !p.indicador),
      'controle com foco sem indicador visivel (WCAG 2.4.7)',
    ).toEqual([]);
    expect(semFoco, 'o foco caiu no body no meio da sequencia de Tab').toBe(0);
  });

  test('dialogo do assistente prende o foco, fecha com Esc e devolve ao gatilho', async ({
    page,
    context,
  }) => {
    test.setTimeout(300_000);

    const seeded = await seedAdminSession(context, page);
    await page.goto('/dashboard');
    if (!hasAdminCredentials() && !seeded) {
      test.skip(true, 'Rota protegida - configure E2E_ADMIN_EMAIL/PASSWORD/SESSION_JSON para executar.');
      return;
    }
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(ROTA_DISCADOR, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

    const gatilho = page.getByRole('button', { name: /assistente de voz/i }).first();
    await expect(gatilho, 'o gatilho do assistente de voz nao existe no discador').toBeVisible();

    // Chega ao gatilho so com Tab, como faria quem opera sem mouse.
    let achou = false;
    for (let i = 0; i < MAX_TABS; i += 1) {
      await page.keyboard.press('Tab');
      if (await gatilho.evaluate((el) => el === document.activeElement)) {
        achou = true;
        break;
      }
    }
    expect(achou, 'o Tab nunca alcancou o gatilho do assistente de voz').toBe(true);

    await page.keyboard.press('Enter');
    const dialogo = page.locator('[role="dialog"][aria-modal="true"]').first();
    await expect(dialogo, 'Enter no gatilho nao abriu o dialogo').toBeVisible({ timeout: 10_000 });

    const estado = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"][aria-modal="true"]');
      const ativo = document.activeElement as HTMLElement | null;
      return { dentro: !!d && !!ativo && d.contains(ativo), focado: ativo?.tagName.toLowerCase() ?? 'null' };
    });
    process.stdout.write(
      `DIALOGO-273 focoDentro=${estado.dentro} elementoFocado=${estado.focado}\n`,
    );
    expect(estado.dentro, 'o foco nao entrou no dialogo: o Tab continua na tela de tras').toBe(true);

    // Tres Tabs: o foco nao pode escapar do modal.
    for (let i = 0; i < 3; i += 1) {
      await page.keyboard.press('Tab');
      const aindaDentro = await page.evaluate(() => {
        const d = document.querySelector('[role="dialog"][aria-modal="true"]');
        return !!d && !!document.activeElement && d.contains(document.activeElement);
      });
      expect(aindaDentro, `o foco escapou do dialogo na tabulacao ${i + 1}`).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(dialogo, 'Esc nao fechou o dialogo').toBeHidden({ timeout: 10_000 });

    const devolveu = await gatilho.evaluate((el) => el === document.activeElement);
    process.stdout.write(`ESC-273 dialogoFechou=true focoNoGatilho=${devolveu}\n`);
    expect(devolveu, 'o foco nao voltou ao gatilho depois de fechar com Esc').toBe(true);
  });
});
