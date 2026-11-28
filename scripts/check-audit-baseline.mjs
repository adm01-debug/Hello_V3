#!/usr/bin/env node
// Etapa 041: `bun audit` imprimia 121 vulnerabilidades e o job concluia
// success (`|| true`). Aqui a contagem e comparada com um baseline versionado:
// subir o numero reprova, cair nao. O baseline e gerado pelo MESMO comando do
// CI (`bun audit --json`), senao os numeros nunca batem.
//
//   node scripts/check-audit-baseline.mjs            -> compara
//   node scripts/check-audit-baseline.mjs --update   -> regrava o baseline
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const arquivoBaseline = join(raiz, 'scripts', 'audit-baseline.json');

let bruto;
try {
  bruto = execFileSync('bun', ['audit', '--json'], { cwd: raiz, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
} catch (err) {
  // `bun audit` sai com codigo != 0 quando ha vulnerabilidade; o JSON vem em stdout.
  bruto = err.stdout ?? '';
}
if (!bruto.trim()) {
  console.error('check-audit-baseline: bun audit nao devolveu JSON');
  process.exit(1);
}

const relatorio = JSON.parse(bruto);
// Agrupa por pacote -> severidade, e conta por par (pacote, advisory) para que o
// mesmo pacote com dois avisos conte duas vezes.
const severidades = ['critical', 'high', 'moderate', 'low'];
const contagem = Object.fromEntries(severidades.map((s) => [s, 0]));
const chaves = new Set();
for (const [pacote, avisos] of Object.entries(relatorio)) {
  for (const aviso of avisos ?? []) {
    const severidade = String(aviso.severity ?? 'low').toLowerCase();
    if (contagem[severidade] !== undefined) contagem[severidade] += 1;
    chaves.add(`${pacote}|${aviso.id ?? aviso.url ?? aviso.title ?? ''}`);
  }
}

if (process.argv.includes('--update')) {
  writeFileSync(
    arquivoBaseline,
    JSON.stringify({ generated_at: new Date().toISOString(), contagem, advisories: [...chaves].sort() }, null, 2) + '\n',
  );
  console.log(`baseline regravado: ${JSON.stringify(contagem)}`);
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(arquivoBaseline, 'utf8'));
const pioraram = [];
for (const severidade of severidades) {
  const agora = contagem[severidade];
  const antes = baseline.contagem?.[severidade] ?? 0;
  const sinal = agora > antes ? 'SUBiu' : agora < antes ? 'caiu' : 'igual';
  console.log(`${severidade}: ${antes} -> ${agora} (${sinal})`);
  if (agora > antes) pioraram.push(`${severidade}: ${antes} -> ${agora}`);
}

const novos = [...chaves].filter((chave) => !(baseline.advisories ?? []).includes(chave));
if (novos.length) {
  console.log(`\n${novos.length} aviso(s) novo(s):`);
  for (const chave of novos.slice(0, 20)) console.log(`  - ${chave}`);
}

if (pioraram.length) {
  console.error(`\nREPROVADO: a contagem de vulnerabilidades subiu (${pioraram.join('; ')}).`);
  console.error('Corrija a dependencia ou justifique no PR e rode `node scripts/check-audit-baseline.mjs --update`.');
  process.exit(1);
}
console.log('\nok: nenhuma severidade subiu em relacao ao baseline.');
