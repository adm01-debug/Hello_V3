#!/usr/bin/env node
// Etapa 054: toda edge function precisa ter o verify_jwt declarado.
// O default implicito (true) foi a causa de anos de 401 silencioso em edges
// chamadas por pg_cron (bearer opaco) e por webhook de terceiro.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const FUNCTIONS_DIR = 'supabase/functions';
const CONFIG = 'supabase/config.toml';

const edges = readdirSync(FUNCTIONS_DIR).filter((d) => {
  if (d === '_shared' || d === '__tests__') return false;
  if (!statSync(join(FUNCTIONS_DIR, d)).isDirectory()) return false;
  return statSync(join(FUNCTIONS_DIR, d, 'index.ts'), { throwIfNoEntry: false });
});

const config = readFileSync(CONFIG, 'utf8');
const declaradas = new Map();
const linhas = config.split('\n');
let atual = null;
for (const linha of linhas) {
  const secao = linha.match(/^\[functions\.([\w-]+)\]\s*$/);
  if (secao) {
    atual = secao[1];
    continue;
  }
  if (/^\[/.test(linha)) {
    atual = null;
    continue;
  }
  const verify = linha.match(/^\s*verify_jwt\s*=\s*(true|false)\s*$/);
  if (atual && verify) declaradas.set(atual, verify[1] === 'true');
}

const problemas = [];
for (const e of edges) {
  if (!declaradas.has(e)) problemas.push(`edge sem verify_jwt declarado: ${e}`);
}
for (const nome of declaradas.keys()) {
  if (!edges.includes(nome)) problemas.push(`config.toml declara funcao inexistente: ${nome}`);
}

if (problemas.length) {
  console.error(problemas.join('\n'));
  process.exit(1);
}
console.log(`ok: ${edges.length} edge functions com verify_jwt declarado (${[...declaradas.values()].filter((v) => !v).length} publicas).`);
