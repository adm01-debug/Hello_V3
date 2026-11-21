#!/usr/bin/env node
/**
 * Orçamento de bundle por rota.
 *
 * Lê o `dist/` produzido pelo Vite e falha quando um chunk passa do limite
 * declarado em `scripts/bundle-budget.json`. A chave do limite é o nome do chunk
 * sem o hash (ex.: `index`, `SecurityAlerts`), porque o hash muda a cada build.
 *
 * Uso:
 *   node scripts/check-bundle-budget.mjs                 # verifica
 *   node scripts/check-bundle-budget.mjs --update        # regrava com os tamanhos atuais
 *   node scripts/check-bundle-budget.mjs --dist=build    # diretório alternativo
 */

import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, resolve } from 'node:path';

const argv = process.argv.slice(2);
const DIST = resolve(process.cwd(), (argv.find((a) => a.startsWith('--dist=')) ?? '--dist=dist').slice(7));
const BUDGET_PATH = resolve(process.cwd(), 'scripts', 'bundle-budget.json');
const UPDATE = argv.includes('--update');

if (!existsSync(DIST)) {
  console.error(`Diretorio de build nao encontrado: ${DIST}`);
  console.error('Rode `bun run build` antes do budget check.');
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith('.js') || full.endsWith('.css')) out.push(full);
  }
  return out;
}

/** `assets/SecurityAlerts-ueQfMk5v.js` -> `SecurityAlerts.js` */
function chunkKey(rel) {
  const base = rel.split('/').pop() ?? rel;
  return base.replace(/-[A-Za-z0-9_-]{8}(\.[a-z0-9]+)$/i, '$1');
}

const assets = walk(DIST).map((full) => {
  const rel = full.slice(DIST.length + 1).replaceAll('\\', '/');
  const raw = readFileSync(full);
  return { file: rel, key: chunkKey(rel), rawKb: raw.length / 1024, gzipKb: gzipSync(raw).length / 1024 };
});

// O chunk de entrada carrega o shell inteiro: limite maior, mas ainda rastreado.
const DEFAULT_LIMITS = { '*': { raw_kb: 1200, gzip_kb: 380 } };
const budget = existsSync(BUDGET_PATH)
  ? JSON.parse(readFileSync(BUDGET_PATH, 'utf8'))
  : { limits: DEFAULT_LIMITS };

if (UPDATE) {
  const largest = [...assets].sort((a, b) => b.gzipKb - a.gzipKb).slice(0, 20);
  const limits = { ...(budget.limits ?? DEFAULT_LIMITS) };
  for (const a of largest) {
    limits[a.key] = {
      gzip_kb: Math.ceil(a.gzipKb * 1.1),
      raw_kb: Math.ceil(a.rawKb * 1.1),
    };
  }
  writeFileSync(
    BUDGET_PATH,
    `${JSON.stringify({ generated_at: new Date().toISOString(), limits }, null, 2)}\n`,
  );
  console.log(`Budget regravado: ${Object.keys(limits).length} limite(s)`);
  process.exit(0);
}

const defaultLimit = budget.limits?.['*'] ?? DEFAULT_LIMITS['*'];
const rows = [];
const violations = [];

for (const a of [...assets].sort((x, y) => y.gzipKb - x.gzipKb)) {
  const limit = budget.limits?.[a.key] ?? defaultLimit;
  const usedPct = (a.gzipKb / limit.gzip_kb) * 100;
  rows.push({ ...a, limit, usedPct });
  if (a.gzipKb > limit.gzip_kb || a.rawKb > limit.raw_kb) violations.push({ ...a, limit });
}

console.log(`Bundle budget - ${assets.length} asset(s) em ${DIST}`);
for (const r of rows.slice(0, 12)) {
  console.log(
    `  ${r.key.padEnd(28)} ${r.gzipKb.toFixed(1).padStart(8)} kB gzip  ${r.usedPct.toFixed(0).padStart(3)}% de ${r.limit.gzip_kb} kB`,
  );
}

if (violations.length > 0) {
  console.error(`\n${violations.length} asset(s) acima do orcamento:`);
  for (const v of violations) {
    console.error(
      `  ${v.file}: ${v.gzipKb.toFixed(1)} kB gzip / ${v.rawKb.toFixed(1)} kB cru (limite ${v.limit.gzip_kb} kB gzip / ${v.limit.raw_kb} kB)`,
    );
  }
  console.error('\nProvavel causa: import estatico de biblioteca pesada. Use React.lazy/import dinamico ou atualize scripts/bundle-budget.json com justificativa na PR.');
  process.exit(1);
}

console.log('\nOK - nenhum asset acima do orcamento.');