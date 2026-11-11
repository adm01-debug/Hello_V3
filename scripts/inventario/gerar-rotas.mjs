#!/usr/bin/env node
/**
 * Inventario das rotas do front -> inventario/estado/rotas.json (fonte de consulta dos agentes).
 *
 * Le o codigo, nao documentacao:
 *  - Rotas: src/routes/publicRoutes.tsx e src/routes/protectedRoutes.tsx (path, componente lazy,
 *    roles) — as duas listas que o src/App.tsx monta em <Routes>.
 *  - Para cada rota: segue os imports a partir do arquivo da pagina (mesma pasta, src/hooks/,
 *    src/services/, src/lib/, src/features/) e lista hooks, edge functions invocadas, RPCs,
 *    tabelas (.from e /rest/v1) e buckets de storage (storage.from).
 *  - `problemas`: rota sem arquivo, path duplicado, pagina em src/pages/ sem rota (orfa) e import
 *    local que nao resolve.
 *
 * Uso:
 *   node scripts/inventario/gerar-rotas.mjs           grava inventario/estado/rotas.json
 *   node scripts/inventario/gerar-rotas.mjs --check   exit 1 se o arquivo commitado esta desatualizado
 * Saida deterministica (sem data): o mesmo codigo gera o mesmo arquivo.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ_PADRAO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SAIDA_REL = 'inventario/estado/rotas.json';
const EXTENSOES = ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts'];

const ler = (raiz, rel) => fs.readFileSync(path.join(raiz, rel), 'utf8');
const rel = (raiz, abs) => path.relative(raiz, abs).split(path.sep).join('/');
const unico = (lista) => [...new Set(lista)].sort();

/** Resolve um especificador de import para um arquivo do repo (ou null se externo/inexistente). */
export function resolverImport(raiz, deArquivoAbs, especificador) {
  let base;
  if (especificador.startsWith('@/')) base = path.join(raiz, 'src', especificador.slice(2));
  else if (especificador.startsWith('.')) base = path.resolve(path.dirname(deArquivoAbs), especificador);
  else return null;
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  for (const ext of EXTENSOES) if (fs.existsSync(base + ext)) return base + ext;
  return undefined; // local, mas nao existe
}

/** Imports de um arquivo: [{ especificador, nomes[] }] (estaticos e import() dinamico). */
export function extrairImports(texto) {
  const out = [];
  for (const m of texto.matchAll(/import\s+(type\s+)?([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g)) {
    if (m[1]) continue;
    const nomes = [...m[2].matchAll(/\b([A-Za-z_$][\w$]*)\b(?!\s*as\b)/g)].map((x) => x[1])
      .filter((n) => !['type', 'as', 'default'].includes(n));
    out.push({ especificador: m[3], nomes });
  }
  for (const m of texto.matchAll(/(?:import|export)\s*(?:\*\s*from\s*)?['"]([^'"]+)['"]/g)) out.push({ especificador: m[1], nomes: [] });
  for (const m of texto.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)) out.push({ especificador: m[1], nomes: [] });
  for (const m of texto.matchAll(/export\s+(?:\{[^}]*\}|\*)\s+from\s+['"]([^'"]+)['"]/g)) out.push({ especificador: m[1], nomes: [] });
  return out;
}

/**
 * Mapa nome -> valor dos `const NOME = 'literal'` (ou `export const`) de nivel de modulo no texto.
 * So resolve o caso mais comum do repo: identificador passado direto pra `.from`/`fromTable`/
 * `storage.from`/`rpc`/`invoke` que e, no mesmo arquivo, uma constante de string (ex.:
 * `RECORDINGS_BUCKET`, `AUDIT_LOGS_TABLE`). Nao resolve parametro de funcao nem ternario.
 * Coluna zero sozinha nao basta (achado do Qodo na revisao desta correcao): um `const` dentro
 * de funcao tambem pode estar em coluna zero se o arquivo nao passou pelo Prettier (o repo nao
 * tem `prettier --check` no CI). Por isso conta profundidade de `{`/`}` linha a linha e so
 * aceita o `const` quando a profundidade, ANTES de processar a linha, e zero (nivel de modulo
 * de verdade). Contagem ingenua (nao ignora chave dentro de string/template) e de proposito:
 * na duvida, prefere nao resolver a resolver errado.
 */
function constantesDeString(texto) {
  const mapa = new Map();
  let profundidade = 0;
  for (const linha of texto.split('\n')) {
    if (profundidade === 0) {
      const m = linha.match(/^(?:export\s+)?const\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?::\s*[^=]+)?=\s*['"`]([A-Za-z0-9_.-]+)['"`]\s*[;,]?\s*$/);
      if (m) mapa.set(m[1], m[2]);
    }
    for (const ch of linha) {
      if (ch === '{') profundidade++;
      else if (ch === '}') profundidade--;
    }
  }
  return mapa;
}

/**
 * Chamadas ao Supabase num texto: tabelas (`.from` do cliente, `fromTable` de
 * src/lib/supabaseHelpers.ts e `/rest/v1/<tabela>`), buckets (`storage.from`), RPCs (`.rpc`) e
 * edges (`functions.invoke`, `invokeEdge`, `/functions/v1/<edge>`).
 */
export function extrairChamadas(texto) {
  const pegar = (re) => [...texto.matchAll(re)].map((m) => m[1]);
  const consts = constantesDeString(texto);
  const tabelas = [];
  const buckets = [];
  for (const m of texto.matchAll(/(\bstorage\s*)?\.from\(\s*['"`]([A-Za-z0-9_-]+)['"`]/g)) (m[1] ? buckets : tabelas).push(m[2]);
  for (const m of texto.matchAll(/(\bstorage\s*)?\.from\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)/g)) {
    if (consts.has(m[2])) (m[1] ? buckets : tabelas).push(consts.get(m[2]));
  }
  // `fromTable('x')` / `fromTable(CONST)` — atalho tipado de src/lib/supabaseHelpers.ts, sempre tabela.
  for (const m of texto.matchAll(/\bfromTable\(\s*['"`]([A-Za-z0-9_-]+)['"`]/g)) tabelas.push(m[1]);
  for (const m of texto.matchAll(/\bfromTable\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)/g)) {
    if (consts.has(m[1])) tabelas.push(consts.get(m[1]));
  }
  tabelas.push(...pegar(/\/rest\/v1\/([A-Za-z0-9_]+)/g).filter((t) => t !== 'rpc'));
  return {
    tabelas,
    buckets,
    // `.rpc('x')` e o apelido `const rpc = supabase.rpc.bind(...)` + `rpc('x')`.
    rpcs: [...pegar(/(?:\.|\b)rpc\(\s*['"`]([A-Za-z0-9_]+)['"`]/g), ...pegar(/\/rest\/v1\/rpc\/([A-Za-z0-9_]+)/g)],
    // `functions.invoke` (inclusive quebrado em linha) e o atalho `invokeEdge<T>(...)` de
    // src/lib/invokeEdge.ts; `invoke('evolution-api/connect')` conta como a edge `evolution-api`.
    // `fetch(`${SUPABASE_URL}/functions/v1/get-call-recording`)` (chamada direta pela URL): so dentro
    // de string/template; a URL mostrada como texto em JSX (ex.: GmailWebhookMonitor) nao e chamada.
    edges: [
      ...pegar(/(?:functions\s*\.\s*invoke|\binvokeEdge)(?:<[^>()]*>)?\(\s*['"`]([A-Za-z0-9_-]+)(?:\/[^'"`]*)?['"`]/g),
      ...pegar(/['"`][^'"`\n]*\/functions\/v1\/([A-Za-z0-9_-]+)/g),
    ],
  };
}

const ehTeste = (p) => /(\.test\.|\.spec\.|__tests__|\.stories\.)/.test(p);

/**
 * Fecho de imports a partir do arquivo da tela. Segue sem limite a pasta da feature da tela,
 * src/hooks/, src/services/, src/lib/ e src/features/ (helpers que chamam edge/RPC, ex.:
 * callCRMIntegration, mapboxToken); componentes de OUTRA feature em src/components/ (ex.: a aba
 * Filas da Supervisão renderiza QueuesView) entram ate MAX_SALTOS_FEATURE saltos. Fica de fora
 * so o kit de UI (src/components/ui/) e teste. Import local que nao resolve vira problema.
 */
export const MAX_SALTOS_FEATURE = 2;
export function fechoDaTela(raiz, arquivoTelaAbs) {
  const pastaFeature = path.dirname(arquivoTelaAbs);
  const dentro = (abs, rel_) => abs.startsWith(path.join(raiz, rel_) + path.sep);
  const livre = (abs) => abs.startsWith(pastaFeature + path.sep) || ['src/hooks', 'src/services', 'src/lib', 'src/features'].some((d) => dentro(abs, d));
  const outraFeature = (abs) => dentro(abs, 'src/components') && !dentro(abs, 'src/components/ui');
  const saltosVistos = new Map(); // arquivo -> menor numero de saltos com que foi visitado
  const hooks = new Map();
  const quebrados = new Set();
  const chamadas = { tabelas: [], buckets: [], rpcs: [], edges: [] };
  const fila = [[arquivoTelaAbs, 0]];
  while (fila.length) {
    const [atual, saltos] = fila.shift();
    if (saltosVistos.has(atual) && saltosVistos.get(atual) <= saltos) continue;
    const primeiraVez = !saltosVistos.has(atual);
    saltosVistos.set(atual, saltos);
    const texto = fs.readFileSync(atual, 'utf8');
    if (primeiraVez) {
      const c = extrairChamadas(texto);
      for (const k of Object.keys(chamadas)) chamadas[k].push(...c[k]);
    }
    for (const imp of extrairImports(texto)) {
      const alvo = resolverImport(raiz, atual, imp.especificador);
      if (alvo === undefined && !/\.(css|scss|svg|png|jpe?g|webp|gif|json)(\?.*)?$|\?/.test(imp.especificador)) {
        quebrados.add(`${rel(raiz, atual)} -> ${imp.especificador}`);
      }
      if (!alvo || ehTeste(alvo)) continue;
      for (const nome of imp.nomes) if (/^use[A-Z]/.test(nome) && !hooks.has(nome)) hooks.set(nome, rel(raiz, alvo));
      if (livre(alvo)) fila.push([alvo, saltos]);
      else if (outraFeature(alvo) && saltos < MAX_SALTOS_FEATURE) fila.push([alvo, saltos + 1]);
    }
  }
  return {
    arquivos_lidos: saltosVistos.size,
    arquivos: [...saltosVistos.keys()].map((a) => rel(raiz, a)).sort(),
    hooks: [...hooks.entries()].map(([nome, arquivo]) => ({ nome, arquivo })).sort((a, b) => a.nome.localeCompare(b.nome)),
    buckets: unico(chamadas.buckets),
    edges: unico(chamadas.edges),
    rpcs: unico(chamadas.rpcs),
    tabelas: unico(chamadas.tabelas),
    imports_quebrados: [...quebrados].sort(),
  };
}

/**
 * Rotas do react-router. Neste repo a lista vive em src/routes/publicRoutes.tsx e
 * src/routes/protectedRoutes.tsx, cada entrada `{ path, element: Componente, roles? }`, com o
 * componente declarado acima como `const Componente = lazy(() => import('@/pages/...'))`.
 */
export const ARQUIVOS_DE_ROTA = [
  { arquivo: 'src/routes/publicRoutes.tsx', lista: 'publicRoutes', protegida: false },
  { arquivo: 'src/routes/protectedRoutes.tsx', lista: 'protectedRoutes', protegida: true },
];

/** Mapa componente -> especificador de import dos `const X = lazy(() => import('...'))`. */
export function lerLazy(texto) {
  const mapa = {};
  for (const m of texto.matchAll(/const\s+(\w+)\s*=\s*lazy\w*\(\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    if (!(m[1] in mapa)) mapa[m[1]] = m[2];
  }
  return mapa;
}

/** Entradas `{ path, element, roles }` do array exportado `nome`. */
export function lerEntradas(texto, nome) {
  const i = texto.indexOf(`export const ${nome}`);
  if (i < 0) return [];
  // O `[` do array vem depois do `=`; sem isso o `[]` de uma anotacao de tipo
  // (`export const protectedRoutes: RouteConfig[] = [`) seria lido como o array.
  const igual = texto.indexOf('=', i);
  if (igual < 0) return [];
  const abre = texto.indexOf('[', igual);
  if (abre < 0) return [];
  let prof = 0;
  let fim = -1;
  for (let k = abre; k < texto.length; k += 1) {
    if (texto[k] === '[') prof += 1;
    else if (texto[k] === ']') { prof -= 1; if (prof === 0) { fim = k; break; } }
  }
  const corpo = texto.slice(abre, fim < 0 ? texto.length : fim);
  const entradas = [];
  for (const m of corpo.matchAll(/\{\s*path:\s*["'`]([^"'`]+)["'`]\s*,\s*element:\s*(\w+)([^}]*)\}/g)) {
    const papeis = ((m[3].match(/roles:\s*\[([^\]]*)\]/) || [])[1] || '')
      .match(/['"]([^'"]+)['"]/g)?.map((s) => s.slice(1, -1)) ?? [];
    entradas.push({ caminho: m[1], componente: m[2], papeis });
  }
  return entradas;
}

/** Todas as rotas dos arquivos de ARQUIVOS_DE_ROTA, com o arquivo de cada pagina resolvido. */
export function lerRotas(raiz) {
  const rotas = [];
  for (const fonte of ARQUIVOS_DE_ROTA) {
    const caminhoAbs = path.join(raiz, fonte.arquivo);
    if (!fs.existsSync(caminhoAbs)) continue;
    const texto = fs.readFileSync(caminhoAbs, 'utf8');
    const lazy = lerLazy(texto);
    for (const e of lerEntradas(texto, fonte.lista)) {
      const esp = lazy[e.componente];
      const alvo = esp ? resolverImport(raiz, caminhoAbs, esp) : null;
      rotas.push({
        caminho: e.caminho,
        componente: e.componente,
        arquivo: alvo ? rel(raiz, alvo) : null,
        protegida: fonte.protegida,
        papeis: e.papeis,
        declarada_em: fonte.arquivo,
      });
    }
  }
  return rotas.sort((a, b) => a.caminho.localeCompare(b.caminho) || a.componente.localeCompare(b.componente));
}

/** Paginas de src/pages/ (sem teste nem componente auxiliar em subpasta _*). */
export function paginasDoRepo(raiz) {
  const base = path.join(raiz, 'src/pages');
  if (!fs.existsSync(base)) return [];
  const saida = [];
  const andar = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { if (!e.name.startsWith('_') && !ehTeste(full)) andar(full); continue; }
      if (/\.(tsx|jsx)$/.test(e.name) && !ehTeste(full)) saida.push(rel(raiz, full));
    }
  };
  andar(base);
  return saida.sort();
}

/** Monta o inventario inteiro a partir de uma raiz de repo. */
export function gerarRotas(raiz = RAIZ_PADRAO) {
  // `arquivos` (fecho de imports de cada pagina) nao vai pro JSON: serve para dizer se um arquivo
  // de src/pages/ e alcancado por alguma rota. Sem isso, subcomponente de pagina viraria "orfao".
  const alcancados = new Set();
  const rotas = lerRotas(raiz).map((r) => {
    const fecho = r.arquivo
      ? fechoDaTela(raiz, path.join(raiz, r.arquivo))
      : { arquivos_lidos: 0, arquivos: [], hooks: [], buckets: [], edges: [], rpcs: [], tabelas: [], imports_quebrados: [] };
    const { arquivos, ...resto } = fecho;
    for (const a of arquivos) alcancados.add(a);
    return { ...r, ...resto };
  });

  const hooks = {};
  for (const r of rotas) for (const h of r.hooks) {
    hooks[h.nome] ??= { arquivo: h.arquivo, rotas: [] };
    hooks[h.nome].rotas.push(r.caminho);
  }

  const orfas = paginasDoRepo(raiz).filter((f) => !alcancados.has(f));
  const vistos = new Set();
  const duplicadas = rotas.map((r) => r.caminho).filter((c) => (vistos.has(c) ? true : (vistos.add(c), false)));

  const problemas = [
    ...rotas.filter((r) => !r.arquivo).map((r) => ({
      tipo: 'rota_sem_arquivo', id: r.caminho, detalhe: `${r.componente} nao resolve em ${r.declarada_em}`,
    })),
    ...unico(duplicadas).map((c) => ({ tipo: 'rota_duplicada', id: c, detalhe: 'mesmo path declarado mais de uma vez' })),
    ...orfas.map((f) => ({ tipo: 'pagina_orfa', id: f, detalhe: 'arquivo em src/pages/ que nenhuma rota alcanca (nem direto, nem por import)' })),
    ...rotas.flatMap((r) => r.imports_quebrados.map((q) => ({ tipo: 'import_quebrado', id: r.caminho, detalhe: q }))),
  ];

  return {
    format_version: 1,
    fonte: `scripts/inventario/gerar-rotas.mjs (le ${ARQUIVOS_DE_ROTA.map((f) => f.arquivo).join(', ')}, src/pages/ e os imports de cada pagina)`,
    resumo: {
      rotas: rotas.length,
      rotas_publicas: rotas.filter((r) => !r.protegida).length,
      rotas_protegidas: rotas.filter((r) => r.protegida).length,
      paginas_orfas: orfas.length,
      hooks_distintos: Object.keys(hooks).length,
      problemas: problemas.length,
    },
    rotas,
    hooks: Object.fromEntries(Object.keys(hooks).sort().map((k) => [k, { arquivo: hooks[k].arquivo, rotas: unico(hooks[k].rotas) }])),
    paginas_orfas: orfas,
    problemas,
  };
}

export const serializar = (inv) => JSON.stringify(inv, null, 2) + '\n';

function main(argv) {
  const saida = path.join(RAIZ_PADRAO, SAIDA_REL);
  const conteudo = serializar(gerarRotas(RAIZ_PADRAO));
  if (argv.includes('--check')) {
    const atual = fs.existsSync(saida) ? fs.readFileSync(saida, 'utf8') : '';
    if (atual !== conteudo) {
      console.error(`${SAIDA_REL} desatualizado: rode node scripts/inventario/gerar-rotas.mjs e commite o resultado.`);
      process.exit(1);
    }
    console.log(`${SAIDA_REL} em dia.`);
    return;
  }
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  fs.writeFileSync(saida, conteudo);
  const r = JSON.parse(conteudo).resumo;
  console.log(`rotas.json: ${r.rotas} rotas (${r.rotas_publicas} publicas, ${r.rotas_protegidas} protegidas), `
    + `${r.hooks_distintos} hooks, ${r.paginas_orfas} paginas orfas, ${r.problemas} problemas.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
