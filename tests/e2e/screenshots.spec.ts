import { test, expect } from '@playwright/test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { seedAdminSession } from './helpers/adminSession';
import { hasAdminCredentials } from './helpers/skipGuard';

/**
 * Etapa 270 — conferência das telas internas em largura de celular.
 *
 * As 10 rotas públicas já foram medidas (2026-11-23, A-137). O que não tinha
 * cobertura eram as telas de dentro do sistema, que exigem login. Aqui elas são
 * capturadas em 390/768/1280 e o transbordo horizontal é medido.
 *
 * Não é teste de regressão visual: nenhum pixel é comparado. As asserções são
 * sobre a captura ser real (URL e título de cada tela), não sobre o layout — os
 * problemas encontrados viram achados para a etapa 271.
 */

interface Captura {
  tela: string;
  rota: string;
  largura: number;
  url: string;
  titulo: string;
  scrollWidth: number;
  clientWidth: number;
  transbordoPx: number;
  culpados: string[];
}

const TELAS = [
  { nome: 'discador', rota: '/' },
  { nome: 'central-chamadas', rota: '/calls' },
  { nome: 'historico', rota: '/history' },
  { nome: 'fila', rota: '/queue-dashboard' },
  { nome: 'painel-executivo', rota: '/executive' },
];

const LARGURAS = [390, 768, 1280];
const SAIDA = join(process.cwd(), 'capturas', '270');

test.describe('Etapa 270 — telas internas em largura de celular', () => {
  test('captura 5 telas em 3 larguras e mede transbordo horizontal', async ({ page, context }) => {
    test.setTimeout(300_000);

    const seeded = await seedAdminSession(context, page);
    await page.goto('/dashboard');

    // Sem credenciais no ambiente (rodada local) o spec se pula. Com credenciais,
    // autenticar é obrigatório: uma captura da tela de login passaria como "sem
    // transbordo" e mentiria sobre as telas internas.
    if (!hasAdminCredentials() && !seeded) {
      test.skip(true, 'Rota protegida — configure E2E_ADMIN_EMAIL/PASSWORD/SESSION_JSON para executar.');
      return;
    }

    await page.waitForLoadState('networkidle').catch(() => undefined);
    expect(
      new URL(page.url()).pathname,
      `a sessão de admin não autenticou: /dashboard caiu em ${page.url()}`,
    ).not.toMatch(/^\/(login|auth)/);

    rmSync(SAIDA, { recursive: true, force: true });
    mkdirSync(SAIDA, { recursive: true });
    const capturas: Captura[] = [];

    for (const tela of TELAS) {
      for (const largura of LARGURAS) {
        await page.setViewportSize({ width: largura, height: 844 });
        await page.goto(tela.rota, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => undefined);

        await page.screenshot({
          path: join(SAIDA, `${tela.nome}-${largura}.png`),
          fullPage: true,
        });

        const medida = await page.evaluate(() => {
          const raiz = document.documentElement;
          const viewport = raiz.clientWidth;
          const culpados: string[] = [];

          for (const elemento of Array.from(document.body.querySelectorAll('*'))) {
            const caixa = elemento.getBoundingClientRect();
            if (caixa.width > 0 && caixa.right > viewport + 1) {
              const primeiraClasse =
                typeof elemento.className === 'string' ? elemento.className.split(' ')[0] : '';
              const sufixo = primeiraClasse ? `.${primeiraClasse}` : '';
              culpados.push(`${elemento.tagName.toLowerCase()}${sufixo}@${Math.round(caixa.right)}`);
              if (culpados.length >= 5) break;
            }
          }

          return {
            scrollWidth: raiz.scrollWidth,
            clientWidth: viewport,
            culpados,
            titulo: (document.querySelector('h1')?.textContent ?? '').trim(),
          };
        });

        capturas.push({
          tela: tela.nome,
          rota: tela.rota,
          largura,
          url: new URL(page.url()).pathname,
          ...medida,
          transbordoPx: Math.max(0, medida.scrollWidth - medida.clientWidth),
        });
      }
    }

    writeFileSync(join(SAIDA, 'relatorio.json'), JSON.stringify(capturas, null, 2));
    // stdout do runner: é por aqui que o relatório das medidas chega ao log do CI.
    process.stdout.write(`RELATORIO-270 ${JSON.stringify(capturas)}\n`);

    expect(capturas).toHaveLength(TELAS.length * LARGURAS.length);
    // Cada captura é da rota pedida, não de um redirect: sem isto, cinco telas
    // deslogadas viram cinco imagens iguais e o relatório diz "tudo certo".
    expect(
      capturas.filter((c) => c.url !== c.rota).map((c) => `${c.tela}: pedi ${c.rota}, veio ${c.url}`),
    ).toEqual([]);
  });
});