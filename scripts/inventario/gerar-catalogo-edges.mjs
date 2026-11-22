#!/usr/bin/env node
/**
 * Catalogo publico das edge functions -> docs/edge-functions/README.md
 *
 * Le o codigo, nao documentacao (mesma filosofia de scripts/inventario/*):
 *  - descricao: primeira linha de comentario do index.ts, quando existe
 *  - auth: getUser() do SDK, leitura do header Authorization, e gate de role
 *  - service_role: uso de SUPABASE_SERVICE_ROLE_KEY
 *  - validacao: validateBody / Zod
 *  - rate limit: checkRateLimit*
 *  - segredos: Deno.env.get(...)
 *  - chamadores: functions.invoke / functions/v1/<slug> em src, migrations, outras edges e e2e
 *
 * Uso:
 *   node scripts/inventario/gerar-catalogo-edges.mjs           grava docs/edge-functions/README.md
 *   node scripts/inventario/gerar-catalogo-edges.mjs --check   exit 1 se o arquivo commitado esta desatualizado
 * Saida deterministica (sem data): o mesmo codigo gera o mesmo arquivo.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const FDIR = join(RAIZ, 'supabase/functions');
const SAIDA = 'docs/edge-functions/README.md';

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function rg(pattern, paths) {
  try {
    return execFileSync('rg', ['-l', '--no-messages', pattern, ...paths.map((p) => join(RAIZ, p))], { encoding: 'utf8' })
      .split('\n').filter(Boolean).map((f) => f.slice(RAIZ.length));
  } catch (erro) {
    if (erro?.status === 1) return [];
    throw new Error(`ripgrep falhou (exit ${erro?.status ?? 'desconhecido'})`, { cause: erro });
  }
}

/** Primeira linha de comentario do arquivo, limpa; null quando nao ha. */
function descricao(code) {
  for (const linha of code.split('\n').slice(0, 4)) {
    const m = linha.match(/^\s*\/\/\s*(.+)$/);
    if (m) return m[1].trim();
  }
  return null;
}

/** Classificacao de auth derivada do codigo, na ordem mais restritiva primeiro. */
function auth(code) {
  const leHeader = /req\.headers\.get\(\s*['"]Authorization/.test(code);
  const getUser = /auth\.getUser\(/.test(code);
  const roleGate = /\[\s*['"]admin['"]\s*,\s*['"]supervisor['"]|\[\s*['"]supervisor['"]\s*,\s*['"]admin['"]/.test(code)
    || /role\s*!==\s*['"]admin['"]/.test(code);
  if (!leHeader && !getUser) return 'publico';
  if (!getUser) return 'header-only';
  if (roleGate) return 'admin/supervisor';
  return 'autenticado';
}

const slugs = readdirSync(FDIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('_') && existsSync(join(FDIR, d.name, 'index.ts')))
  .map((d) => d.name).sort();

const linhas = [];
let publicas = 0, autenticadas = 0, staff = 0, semChamador = 0;

for (const slug of slugs) {
  const code = readFileSync(join(FDIR, slug, 'index.ts'), 'utf8');
  const q = esc(slug);
  const padrao = `functions\\.invoke\\(\\s*['"\`]${q}['"\`]|functions/v1/${q}\\b|['"\`]${q}['"\`]\\s*[,)]`;

  const chamadores = {
    src: rg(padrao, ['src']).length,
    migrations: rg(`functions/v1/${q}\\b`, ['supabase/migrations']).length,
    outras: rg(`functions/v1/${q}\\b|['"\`]${q}['"\`]`, ['supabase/functions']).filter((p) => !p.startsWith(`supabase/functions/${slug}/`)).length,
    e2e: rg(q, ['e2e']).length,
  };
  const totalChamadores = chamadores.src + chamadores.migrations + chamadores.outras;
  if (totalChamadores === 0) semChamador += 1;

  const segredos = [...new Set([...code.matchAll(/Deno\.env\.get\(\s*['"]([A-Z0-9_]+)['"]/g)].map((m) => m[1]))].sort();
  const classe = auth(code);
  if (classe === 'publico') publicas += 1;
  else if (classe === 'admin/supervisor') staff += 1;
  else autenticadas += 1;

  linhas.push({
    slug,
    descricao: descricao(code),
    auth: classe,
    serviceRole: /SUPABASE_SERVICE_ROLE_KEY/.test(code),
    validacao: /validateBody|Zod|z\.object/.test(code),
    rateLimit: /checkRateLimit/.test(code),
    segredos: segredos.filter((s) => !['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'].includes(s)),
    chamadores,
    totalChamadores,
    linhas: code.split('\n').length,
  });
}

const sim = (b) => (b ? 'sim' : '—');
const celula = (t) => t.replace(/\|/g, '\\|');

const out = [];
out.push('<!-- Gerado por scripts/inventario/gerar-catalogo-edges.mjs — nao editar a mao. -->');
out.push('');
out.push('# Catálogo de edge functions');
out.push('');
out.push('Fonte: leitura de `supabase/functions/*/index.ts` no próprio repositório. Cada coluna é derivada do código,');
out.push('não de documentação — por isso o arquivo é regenerável e verificável por CI.');
out.push('');
out.push('Gerar de novo: `node scripts/inventario/gerar-catalogo-edges.mjs`  ');
out.push('Conferir se está atualizado: `node scripts/inventario/gerar-catalogo-edges.mjs --check`');
out.push('');
out.push('## Resumo');
out.push('');
out.push(`- **${slugs.length}** edge functions`);
out.push(`- **${publicas}** públicas (sem leitura de JWT no código)`);
out.push(`- **${autenticadas}** exigem usuário autenticado`);
out.push(`- **${staff}** exigem papel admin/supervisor`);
out.push(`- **${semChamador}** sem chamador no repositório (invocadas por cron, webhook externo ou uso manual)`);
out.push('');
out.push('## Colunas');
out.push('');
out.push('| Coluna | Significado |');
out.push('| --- | --- |');
out.push('| **Auth** | `publico` = não lê JWT; `autenticado` = `auth.getUser()`; `admin/supervisor` = além do usuário, checa papel |');
out.push('| **service_role** | o código usa `SUPABASE_SERVICE_ROLE_KEY` (bypassa RLS) |');
out.push('| **Zod** | o corpo é validado por schema (`validateBody`/Zod) |');
out.push('| **rate** | aplica `checkRateLimit*` |');
out.push('| **Chamadores** | `src` / `mig` / `edge` / `e2e` = onde a função é invocada |');
out.push('| **Segredos** | variáveis lidas além das três do Supabase |');
out.push('');
out.push('## Catálogo');
out.push('');
out.push('| Função | Descrição (do código) | Auth | service_role | Zod | rate | Chamadores | Segredos | Linhas |');
out.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const l of linhas) {
  const c = l.chamadores;
  out.push(`| \`${l.slug}\` | ${l.descricao ? celula(l.descricao) : '—'} | ${l.auth} | ${sim(l.serviceRole)} | ${sim(l.validacao)} | ${sim(l.rateLimit)} | src ${c.src} / mig ${c.migrations} / edge ${c.outras} / e2e ${c.e2e} | ${l.segredos.length ? l.segredos.map((s) => '`' + s + '`').join(', ') : '—'} | ${l.linhas} |`);
}
out.push('');
out.push('## Funções sem chamador no repositório');
out.push('');
out.push('Invocadas fora do repositório (cron, webhook de terceiro) ou disponíveis apenas para operação manual.');
out.push('');
for (const l of linhas.filter((x) => x.totalChamadores === 0)) {
  out.push(`- \`${l.slug}\`${l.descricao ? ' — ' + l.descricao : ''}`);
}
out.push('');
out.push('## Funções públicas que usam `service_role`');
out.push('');
out.push('Combinam ausência de checagem de JWT no código com bypass de RLS. Cada uma precisa de outro controle');
out.push('(segredo compartilhado, assinatura HMAC, rate limit ou origem restrita) — e é onde uma auditoria de');
out.push('exposição deve começar.');
out.push('');
const expostas = linhas.filter((x) => x.auth === 'publico' && x.serviceRole);
if (expostas.length === 0) out.push('Nenhuma.');
else for (const l of expostas) out.push(`- \`${l.slug}\`${l.rateLimit ? ' (rate limit aplicado)' : ''}`);
out.push('');

const conteudo = out.join('\n');
const destino = join(RAIZ, SAIDA);

if (process.argv.includes('--check')) {
  const atual = existsSync(destino) ? readFileSync(destino, 'utf8') : '';
  if (atual !== conteudo) {
    console.error(`${SAIDA} esta desatualizado. Rode: node scripts/inventario/gerar-catalogo-edges.mjs`);
    process.exit(1);
  }
  console.log(`${SAIDA} atualizado (${slugs.length} edge functions).`);
  process.exit(0);
}

mkdirSync(join(RAIZ, 'docs/edge-functions'), { recursive: true });
writeFileSync(destino, conteudo);
console.log(`${SAIDA} gerado: ${slugs.length} edge functions.`);
