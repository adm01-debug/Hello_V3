import { test, expect } from '@playwright/test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { seedAdminSession } from './helpers/adminSession';
import { hasAdminCredentials } from './helpers/skipGuard';

/**
 * Etapa 270 — conferência das telas internas em largura de celular.
 * Etapa 271 — localizar a causa e exigir transbordo zero.
 *
 * As 10 rotas públicas já foram medidas (2026-11-23, A-137). O que não tinha
 * cobertura eram as telas de dentro do sistema, que exigem login. Aqui elas são
 * capturadas em 390/768/1280 e o transbordo horizontal é medido em dois níveis:
 *
 * - `transbordoPx`  — a página (documento) passa da largura da tela: rolagem
 *   horizontal na tela inteira, o caso que a etapa 271 corrige.
 * - `conteudo`      — o que passa da largura dentro de <main>: conteúdo cortado
 *   sem que a página role. Um `overflow-x-auto` proposital (tabela larga) não
 *   conta, porque o que está dentro dele não estica o <main>.
 *
 * Não é teste de regressão visual: nenhum pixel é comparado. As asserções são
 * sobre a captura ser real (URL de cada tela) e sobre o layout caber.
 */

interface ElementoCulpado {
  /** tag + até 3 classes + [left..right largura posição/overflow-x] */
  el: string;
  /** o pai já cabe na largura: este é candidato a causa, não a vítima esticada */
  fronteira: boolean;
  /** já está dentro de algo que recorta (uma rolagem proposital, por exemplo) */
  recortado: boolean;
  /** largura medida da caixa */
  largura: number;
  /** começo do texto do elemento: identifica o culpado sem abrir o print */
  texto: string;
  ancestrais: string[];
}

interface Area {
  scrollWidth: number;
  clientWidth: number;
  transbordoPx: number;
  culpados: ElementoCulpado[];
  /** texto solto que passa da borda sem elemento dono (texto em <td>, por exemplo) */
  textos: string[];
  /** elementos cujo conteúdo passa sem recorte: eles esticam o <main> */
  semRecorte: string[];
}

interface Captura {
  tela: string;
  rota: string;
  largura: number;
  url: string;
  titulo: string;
  scrollWidth: number;
  clientWidth: number;
  transbordoPx: number;
  culpados: ElementoCulpado[];
  textos: string[];
  conteudo: Area | null;
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

test.describe('Etapa 270/271 — telas internas em largura de celular', () => {
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
            const caixa = elemento.getBoundingClientRect();
            const estilo = getComputedStyle(elemento);
            return (
              `${elemento.tagName.toLowerCase()}${classes ? `.${classes}` : ''}` +
              `[${Math.round(caixa.left)}..${Math.round(caixa.right)} ${Math.round(caixa.width)}w ` +
              `${estilo.position}/${estilo.overflowX}]`
            );
          };

          const recortadoPor = (elemento: Element, ate: Element | null) => {
            for (
              let pai = elemento.parentElement;
              pai && pai !== ate && pai !== document.body;
              pai = pai.parentElement
            ) {
              if (getComputedStyle(pai).overflowX !== 'visible') return true;
            }
            return false;
          };

          // Culpados: quem passa da borda, com o elemento de fronteira (o pai já
          // cabe) na frente — é ele, e não o wrapper esticado, que estica a página.
          const culpadosDe = (escopo: Element, limite: number) =>
            Array.from(escopo.querySelectorAll('*'))
              .map((elemento) => ({ elemento, caixa: elemento.getBoundingClientRect() }))
              .filter(({ caixa }) => caixa.width > 0 && caixa.right > limite + 1)
              .map(({ elemento, caixa }) => {
                const pai = elemento.parentElement;
                const fimDoPai = pai ? pai.getBoundingClientRect().right : caixa.right;
                let profundidade = 0;
                for (let no: Element | null = elemento; no && no !== escopo; no = no.parentElement) {
                  profundidade += 1;
                }
                return {
                  elemento,
                  caixa,
                  direita: caixa.right,
                  fronteira: fimDoPai <= limite + 1,
                  profundidade,
                };
              })
              // Fronteira primeiro (quem estica é culpado, quem foi esticado é vítima);
              // entre iguais, o mais fundo — o culpado real fica no fim da cadeia.
              .sort(
                (a, b) =>
                  Number(b.fronteira) - Number(a.fronteira) ||
                  b.profundidade - a.profundidade ||
                  b.direita - a.direita,
              )
              .slice(0, 8)
              .map(({ elemento, caixa, fronteira }) => {
                const ancestrais: string[] = [];
                let pai = elemento.parentElement;
                while (pai && ancestrais.length < 5) {
                  ancestrais.push(descrever(pai));
                  pai = pai.parentElement;
                }
                return {
                  el: descrever(elemento),
                  fronteira,
                  recortado: recortadoPor(elemento, escopo === document.body ? null : escopo),
                  texto: (elemento.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40),
                  ancestrais,
                  largura: Math.round(caixa.width),
                };
              });

          // Texto sem elemento dono: um <td> com nowrap estica a página sem que
          // nenhuma caixa passe da borda, e o relatório acima ficaria vazio.
          const textosDe = (escopo: Element, limite: number) => {
            const achados: string[] = [];
            const caminhante = document.createTreeWalker(escopo, NodeFilter.SHOW_TEXT);
            for (let no = caminhante.nextNode(); no && achados.length < 3; no = caminhante.nextNode()) {
              const conteudo = (no.textContent ?? '').trim();
              if (!conteudo) continue;
              const faixa = document.createRange();
              faixa.selectNodeContents(no);
              const caixa = faixa.getBoundingClientRect();
              if (caixa.width > 0 && caixa.right > limite + 1) {
                const dono = no.parentElement ?? escopo;
                achados.push(
                  `${descrever(dono)} "${conteudo.replace(/\s+/g, ' ').slice(0, 40)}" ` +
                    `[${Math.round(caixa.left)}..${Math.round(caixa.right)}]`,
                );
              }
            }
            return achados;
          };

          // Quem estica o <main> é o elemento cujo conteúdo passa dele mesmo sem
          // rolagem (overflow-x visível): a rolagem proposital fica de fora.
          const semRecorte = (escopo: Element) =>
            Array.from(escopo.querySelectorAll('*'))
              .filter((elemento) => {
                if (elemento.clientWidth <= 0) return false;
                if (getComputedStyle(elemento).overflowX !== 'visible') return false;
                return elemento.scrollWidth > elemento.clientWidth + 1;
              })
              .slice(0, 4)
              .map((elemento) => `${descrever(elemento)} sw=${elemento.scrollWidth}`);

          const principal = document.querySelector('main');
          const conteudo = principal
            ? {
                scrollWidth: principal.scrollWidth,
                clientWidth: principal.clientWidth,
                transbordoPx: Math.max(0, principal.scrollWidth - principal.clientWidth),
                culpados: culpadosDe(principal, principal.getBoundingClientRect().right),
                textos: textosDe(principal, principal.getBoundingClientRect().right),
                semRecorte: semRecorte(principal),
              }
            : null;

          return {
            scrollWidth: raiz.scrollWidth,
            clientWidth: viewport,
            culpados: culpadosDe(document.body, viewport),
            textos: textosDe(document.body, viewport),
            conteudo,
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
    // Etapa 271: nem a página rola de lado, nem o conteúdo fica cortado no <main>.
    expect(
      capturas
        .filter((c) => c.transbordoPx > 0 || (c.conteudo?.transbordoPx ?? 0) > 0)
        .map((c) => ({
          tela: c.tela,
          largura: c.largura,
          pagina: c.transbordoPx,
          conteudo: c.conteudo?.transbordoPx ?? 0,
          culpados: [...c.culpados, ...(c.conteudo?.culpados ?? [])].filter((k) => k.fronteira),
          textos: [...c.textos, ...(c.conteudo?.textos ?? [])],
          semRecorte: c.conteudo?.semRecorte ?? [],
        })),
      'transbordo horizontal: a página ou o conteúdo passou da largura da tela',
    ).toEqual([]);
  });
});