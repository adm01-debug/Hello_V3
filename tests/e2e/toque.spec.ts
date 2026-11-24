import { test, expect } from '@playwright/test';
import { seedAdminSession } from './helpers/adminSession';
import { hasAdminCredentials } from './helpers/skipGuard';

/**
 * Etapa 272 - alvo de toque em largura de celular.
 *
 * A etapa 270 mediu transbordo; a 271 zerou. O que falta e o acabamento: com o
 * dedo, um botao-icone de 24 px nao se acerta. A meta usada aqui e 44x44 px
 * (WCAG 2.5.5, AAA) - o minimo exigivel de 24x24 (WCAG 2.5.8, AA) e a rede de
 * seguranca, nao o alvo.
 *
 * Mede o retangulo real de cada controle interativo visivel em 390 px de
 * largura, com o menu do cabecalho FECHADO (medir com o menu aberto mediria
 * itens de menu, nao a tela). Alvos com display:none, desabilitados, com
 * aria-hidden ou com pointer-events:none ficam de fora: nao recebem toque.
 * Alvo `inline` dentro de uma frase - link no meio de um paragrafo - fica de
 * fora tambem, que e a excecao prevista no proprio criterio do WCAG.
 *
 * O relatorio `RELATORIO-272` sai no stdout do runner; as capturas em
 * `capturas/272/` mostram a tela medida.
 */

/** Meta do plano (WCAG 2.5.5). O piso AA (2.5.8) e 24 px. */
const ALVO_MIN = 44;

interface Alvo {
  /** tag + ate 3 classes, sem variante responsiva (para achar no codigo) */
  el: string;
  /** aria-label, title ou o texto do controle */
  texto: string;
  largura: number;
  altura: number;
  /** menor lado: e ele que o dedo precisa acertar */
  menor: number;
}

interface MedidaDaTela {
  tela: string;
  rota: string;
  controles: number;
  pequenos: Alvo[];
}

const TELAS = [
  { nome: 'discador', rota: '/' },
  { nome: 'central-chamadas', rota: '/calls' },
];

/** Largura de iPhone 12/13/14: o piso dos aparelhos em uso. */
const LARGURA = 390;

test.describe('Etapa 272 - alvo de toque em largura de celular', () => {
  test('mede a area clicavel dos controles em 390 px', async ({ page, context }) => {
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

    await page.setViewportSize({ width: LARGURA, height: 844 });
    const medidas: MedidaDaTela[] = [];

    for (const tela of TELAS) {
      await page.goto(tela.rota, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => undefined);
      // O rodape/telefone do aparelho nao existe aqui; o que importa e nao
      // medir com menu contextual aberto por cima.
      await page.keyboard.press('Escape');

      const alvos = await page.evaluate<Alvo[]>(() => {
        const descrever = (elemento: Element) => {
          const bruto = (elemento as HTMLElement).className;
          const classes =
            typeof bruto === 'string'
              ? bruto
                  .trim()
                  .split(/\s+/)
                  .filter((c) => c && !c.includes(':'))
                  .slice(0, 3)
                  .join('.')
              : '';
          return `${elemento.tagName.toLowerCase()}${classes ? `.${classes}` : ''}`;
        };

        const seletor = [
          'button',
          'a[href]',
          'input:not([type="hidden"])',
          'select',
          'textarea',
          '[role="button"]',
          '[role="tab"]',
          '[role="switch"]',
          '[role="checkbox"]',
          '[role="radio"]',
          '[role="link"]',
          '[role="menuitem"]',
          '[role="combobox"]',
          '[tabindex]:not([tabindex="-1"])',
        ].join(',');

        const achados: Alvo[] = [];
        for (const elemento of Array.from(document.querySelectorAll(seletor))) {
          const html = elemento as HTMLElement;
          if (html.hasAttribute('disabled') || html.getAttribute('aria-disabled') === 'true') continue;
          if (elemento.closest('[aria-hidden="true"],[hidden],[inert]')) continue;

          const estilo = getComputedStyle(elemento);
          if (estilo.display === 'none' || estilo.visibility === 'hidden') continue;
          if (estilo.pointerEvents === 'none') continue;

          const caixa = elemento.getBoundingClientRect();
          if (caixa.width <= 0 || caixa.height <= 0) continue;

          // Excecao do proprio criterio: alvo dentro de uma frase.
          if (elemento.tagName === 'A' && estilo.display === 'inline') continue;

          const menor = Math.min(caixa.width, caixa.height);
          achados.push({
            el: descrever(elemento),
            texto: (
              html.getAttribute('aria-label') ||
              html.getAttribute('title') ||
              html.textContent ||
              ''
            )
              .trim()
              .replace(/\s+/g, ' ')
              .slice(0, 40),
            largura: Math.round(caixa.width),
            altura: Math.round(caixa.height),
            menor: Math.round(menor),
          });
        }

        return achados.sort((a, b) => a.menor - b.menor).slice(0, 400);
      });

      const pequenos = alvos.filter((a) => a.menor < ALVO_MIN);
      medidas.push({ tela: tela.nome, rota: tela.rota, controles: alvos.length, pequenos });
      process.stdout.write(
        `TELA-272 ${tela.nome} controles=${alvos.length} abaixoDe${ALVO_MIN}=${pequenos.length}\n`,
      );
    }

    process.stdout.write(`RELATORIO-272 ${JSON.stringify(medidas)}\n`);

    const comControles = medidas.filter((m) => m.controles > 0);
    expect(
      comControles.map((m) => m.tela),
      'nenhum controle medido: a tela nao renderizou ou a sessao caiu',
    ).toHaveLength(TELAS.length);

    expect(
      medidas.flatMap((m) => m.pequenos.map((a) => ({ tela: m.tela, ...a }))),
      `alvo de toque abaixo de ${ALVO_MIN}x${ALVO_MIN} px na largura de celular`,
    ).toEqual([]);
  });
});
