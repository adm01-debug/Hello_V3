#!/usr/bin/env node
/**
 * Codemod: reescreve chamadas nativas de parseInt/parseFloat/Number.parseInt/Number.parseFloat
 * para os wrappers seguros em `@/lib/safe-number` (safeParseInt/safeParseFloat).
 *
 * Uso:
 *   node scripts/codemod-safe-number.mjs [--check] [--path=src]
 *
 * Modos:
 *   --check    Não escreve; falha (exit 1) se houver ocorrências a reescrever.
 *              Ideal para o passo de CI que garante ausência de regressões.
 *   --path=X   Diretório-alvo (default: src).
 *
 * Regras:
 *   - Ignora `src/lib/safe-number.ts` (fonte dos wrappers).
 *   - Ignora arquivos de teste (`*.test.*`, `*.spec.*`, `__tests__/`).
 *   - Ignora comentários e strings literais (parse por regex tokenizado).
 *   - Injeta import de `@/lib/safe-number` quando necessário, respeitando imports existentes.
 *   - Converte `parseInt(x, 10)` → `safeParseInt(x)` (o radix 10 é o default do wrapper).
 *   - Converte `parseInt(x, r)` (r ≠ 10) → mantém como `parseInt` e sinaliza (radix custom não suportado).
 *   - Suporta `Number.parseInt` / `Number.parseFloat` idem.
 */

import { readFileSync, writeFileSync, statSync, readdirSync } from 'node:fs';
import { join, extname, relative, resolve } from 'node:path';

const argv = process.argv.slice(2);
const CHECK_ONLY = argv.includes('--check');
const targetArg = argv.find((a) => a.startsWith('--path='));
const TARGET_DIR = resolve(process.cwd(), targetArg ? targetArg.slice('--path='.length) : 'src');

const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const IGNORE_FILE_SUBSTRINGS = ['/lib/safe-number.ts', '__tests__/', '.test.', '.spec.'];
const IGNORE_DIRS = new Set(['node_modules', 'dist', 'build', 'coverage', '.next', '.git']);

/** @type {Array<{ file: string; changes: number; reasons: string[] }>} */
const report = [];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (IGNORE_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (EXTENSIONS.has(extname(entry))) out.push(full);
  }
  return out;
}

function shouldIgnore(file) {
  const norm = file.replaceAll('\\', '/');
  return IGNORE_FILE_SUBSTRINGS.some((s) => norm.includes(s));
}

/**
 * Retorna os intervalos [start, end) que devem ser ignorados: strings, template literals
 * e comentários de linha/bloco. Baseado em varredura simples de caracteres.
 */
function computeSkipRanges(src) {
  const ranges = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const c2 = src[i + 1];
    if (c === '/' && c2 === '/') {
      const end = src.indexOf('\n', i);
      ranges.push([i, end === -1 ? n : end]);
      i = end === -1 ? n : end;
    } else if (c === '/' && c2 === '*') {
      const end = src.indexOf('*/', i + 2);
      ranges.push([i, end === -1 ? n : end + 2]);
      i = end === -1 ? n : end + 2;
    } else if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      let j = i + 1;
      while (j < n) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === quote) { j += 1; break; }
        j += 1;
      }
      ranges.push([i, j]);
      i = j;
    } else {
      i += 1;
    }
  }
  return ranges;
}

function inRanges(pos, ranges) {
  for (const [s, e] of ranges) if (pos >= s && pos < e) return true;
  return false;
}

const CALL_RE = /(?<![A-Za-z0-9_$.])(Number\.parseInt|Number\.parseFloat|parseInt|parseFloat)\s*\(/g;

function transform(src) {
  const skip = computeSkipRanges(src);
  const reasons = [];
  let changes = 0;
  let needsSafeInt = false;
  let needsSafeFloat = false;

  // Percorre da direita p/ esquerda para preservar índices ao substituir.
  const matches = [];
  for (const m of src.matchAll(CALL_RE)) {
    if (inRanges(m.index, skip)) continue;
    matches.push(m);
  }
  matches.reverse();

  let out = src;
  for (const m of matches) {
    const name = m[1];
    const openParen = m.index + m[0].length - 1;
    // Encontra o parêntese de fechamento correspondente
    let depth = 1;
    let j = openParen + 1;
    while (j < out.length && depth > 0) {
      const ch = out[j];
      if (inRanges(j, skip)) { j += 1; continue; }
      if (ch === '(') depth += 1;
      else if (ch === ')') depth -= 1;
      if (depth === 0) break;
      j += 1;
    }
    if (depth !== 0) continue;
    const argsSrc = out.slice(openParen + 1, j);
    const isInt = name.endsWith('parseInt');
    // Divide args em topo (respeita parênteses e strings dentro de argsSrc)
    const args = splitTopLevelArgs(argsSrc);
    let replacement;
    if (isInt) {
      if (args.length >= 2) {
        const radix = args[1].trim();
        if (radix !== '10' && radix !== '') {
          reasons.push(`${name}(…, ${radix}) — radix custom preservado (não convertido).`);
          continue;
        }
      }
      needsSafeInt = true;
      replacement = `safeParseInt(${args[0] ?? ''})`;
    } else {
      needsSafeFloat = true;
      replacement = `safeParseFloat(${args[0] ?? ''})`;
    }
    out = out.slice(0, m.index) + replacement + out.slice(j + 1);
    changes += 1;
  }

  if (changes > 0) out = ensureImport(out, needsSafeInt, needsSafeFloat);
  return { out, changes, reasons };
}

function splitTopLevelArgs(src) {
  const parts = [];
  let depth = 0;
  let start = 0;
  const skip = computeSkipRanges(src);
  for (let i = 0; i < src.length; i++) {
    if (inRanges(i, skip)) continue;
    const c = src[i];
    if (c === '(' || c === '[' || c === '{') depth += 1;
    else if (c === ')' || c === ']' || c === '}') depth -= 1;
    else if (c === ',' && depth === 0) {
      parts.push(src.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(src.slice(start));
  return parts;
}

function ensureImport(src, needInt, needFloat) {
  const importRe = /import\s*\{([^}]*)\}\s*from\s*['"]@\/lib\/safe-number['"];?/;
  const existing = src.match(importRe);
  const wanted = new Set();
  if (needInt) wanted.add('safeParseInt');
  if (needFloat) wanted.add('safeParseFloat');
  if (existing) {
    const current = new Set(existing[1].split(',').map((s) => s.trim()).filter(Boolean));
    for (const w of wanted) current.add(w);
    const merged = [...current].sort().join(', ');
    return src.replace(importRe, `import { ${merged} } from '@/lib/safe-number';`);
  }
  const importLine = `import { ${[...wanted].sort().join(', ')} } from '@/lib/safe-number';\n`;
  // Insere após o último import (suporta imports multi-linha terminados em `;`).
  const importStmtRe = /^import[\s\S]*?;\s*\n/gm;
  let lastEnd = -1;
  for (const m of src.matchAll(importStmtRe)) {
    lastEnd = m.index + m[0].length;
  }
  if (lastEnd >= 0) {
    return src.slice(0, lastEnd) + importLine + src.slice(lastEnd);
  }
  return importLine + src;
}

const files = walk(TARGET_DIR).filter((f) => !shouldIgnore(f));
let totalChanges = 0;

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const { out, changes, reasons } = transform(src);
  if (changes > 0) {
    report.push({ file: relative(process.cwd(), file), changes, reasons });
    totalChanges += changes;
    if (!CHECK_ONLY) writeFileSync(file, out);
  }
}

if (report.length > 0) {
  console.log(`\n${CHECK_ONLY ? '❌' : '✅'} safe-number codemod: ${totalChanges} ocorrência(s) em ${report.length} arquivo(s)`);
  for (const r of report) {
    console.log(`  • ${r.file} (${r.changes === 1 ? '1 substituição' : `${r.changes} substituições`})`);
    for (const reason of r.reasons) console.log(`      ↳ ${reason}`);
  }
} else {
  console.log('✅ Nenhum parseInt/parseFloat nativo encontrado fora de src/lib/safe-number.ts.');
}

if (CHECK_ONLY && totalChanges > 0) {
  console.error(
    '\n💡 Rode `node scripts/codemod-safe-number.mjs` localmente para reescrever automaticamente, ' +
      'ou substitua manualmente por safeParseInt/safeParseFloat de @/lib/safe-number.',
  );
  process.exit(1);
}
