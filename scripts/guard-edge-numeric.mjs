#!/usr/bin/env node
/**
 * Guard: garante que Edge Functions Supabase usem schemas numéricos defensivos.
 *
 * Regras aplicadas em `supabase/functions/**\/index.ts`:
 *   R1. Todo `z.number()` deve encadear `.finite()` (direta ou indiretamente via
 *       helpers de `_shared/numeric-schemas.ts` como `finiteNumber`, `percent`,
 *       `finiteInt`, etc.).
 *   R2. Coerções numéricas de input externo (`Number(`, `parseInt(`, `parseFloat(`,
 *       `Number.parseInt(`, `Number.parseFloat(`) são proibidas — use
 *       `parseNumericSafely` + schemas Zod.
 *
 * Ignora:
 *   - `_shared/` (fonte dos helpers) e `__tests__/` (fixtures podem simular).
 *   - Ocorrências dentro de comentários `//` e `/* * /`.
 *   - `Number.isFinite`, `Number.isNaN`, `Number.isInteger`, `Number.MAX_*` etc.
 *
 * Uso:
 *   node scripts/guard-edge-numeric.mjs          # relatório
 *   node scripts/guard-edge-numeric.mjs --check  # exit 1 se houver violações
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = "supabase/functions";
const CHECK = process.argv.includes("--check");

const ALLOW_NUMBER_MEMBERS = new Set([
  "isFinite",
  "isNaN",
  "isInteger",
  "isSafeInteger",
  "MAX_SAFE_INTEGER",
  "MIN_SAFE_INTEGER",
  "MAX_VALUE",
  "MIN_VALUE",
  "EPSILON",
  "POSITIVE_INFINITY",
  "NEGATIVE_INFINITY",
  "NaN",
  "parseInt",
  "parseFloat",
]);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "_shared" || entry === "__tests__") continue;
      out.push(...walk(full));
    } else if (entry === "index.ts") {
      out.push(full);
    }
  }
  return out;
}

function stripCommentsAndStrings(src) {
  // Remove block comments, line comments, template literals e strings — trocando
  // por espaços para preservar offsets/linhas.
  let out = "";
  let i = 0;
  const n = src.length;
  const blank = (s) => s.replace(/[^\n]/g, " ");
  while (i < n) {
    const c = src[i];
    const c2 = src[i + 1];
    if (c === "/" && c2 === "*") {
      const end = src.indexOf("*/", i + 2);
      const stop = end === -1 ? n : end + 2;
      out += blank(src.slice(i, stop));
      i = stop;
    } else if (c === "/" && c2 === "/") {
      const end = src.indexOf("\n", i);
      const stop = end === -1 ? n : end;
      out += blank(src.slice(i, stop));
      i = stop;
    } else if (c === '"' || c === "'" || c === "`") {
      const quote = c;
      let j = i + 1;
      while (j < n) {
        if (src[j] === "\\") {
          j += 2;
          continue;
        }
        if (src[j] === quote) {
          j += 1;
          break;
        }
        j += 1;
      }
      out += blank(src.slice(i, j));
      i = j;
    } else {
      out += c;
      i += 1;
    }
  }
  return out;
}

function lineOf(src, index) {
  let line = 1;
  for (let i = 0; i < index && i < src.length; i += 1) {
    if (src[i] === "\n") line += 1;
  }
  return line;
}

function scanFile(file) {
  const raw = readFileSync(file, "utf8");
  const src = stripCommentsAndStrings(raw);
  const violations = [];

  // R1: z.number() sem .finite() encadeado.
  const znRe = /\bz\s*\.\s*number\s*\(\s*\)/g;
  let m;
  while ((m = znRe.exec(src)) !== null) {
    const tail = src.slice(m.index + m[0].length, m.index + m[0].length + 200);
    if (!/^\s*\.\s*finite\s*\(/.test(tail)) {
      violations.push({
        rule: "R1",
        line: lineOf(src, m.index),
        snippet: "z.number() sem .finite()",
      });
    }
  }

  // R2: Number(...), parseInt(...), parseFloat(...), Number.parseInt/Float(...).
  const coercionRe =
    /\b(?:Number\s*\.\s*(parseInt|parseFloat)|Number|parseInt|parseFloat)\s*\(/g;
  while ((m = coercionRe.exec(src)) !== null) {
    // "Number.isFinite(" etc: verificar caractere anterior à "(" — se for member allow, skip.
    // A regex já casa somente formas com "(" após identificador de coerção;
    // "Number.isFinite" não bate porque exige (parseInt|parseFloat) ou Number seguido de "(".
    // Distinguir `Number.isFinite(` do bruto: se antes do casamento houver `Number.` e o membro
    // for allowlisted, o regex acima não deveria ter casado. Confirmar:
    const before = src.slice(Math.max(0, m.index - 20), m.index);
    if (/Number\s*\.\s*$/.test(before)) {
      // caso "Number.<algo>(" — verificar se <algo> é allowlisted.
      const memberMatch = /\b(Number)\s*\.\s*(\w+)\s*\($/.exec(
        src.slice(Math.max(0, m.index - 20), m.index + m[0].length),
      );
      if (memberMatch && ALLOW_NUMBER_MEMBERS.has(memberMatch[2])) continue;
    }
    violations.push({
      rule: "R2",
      line: lineOf(src, m.index),
      snippet: m[0].trim(),
    });
  }

  return violations;
}

const files = walk(ROOT);
const report = [];
let total = 0;
for (const f of files) {
  const v = scanFile(f);
  if (v.length) {
    total += v.length;
    report.push({ file: relative(process.cwd(), f), violations: v });
  }
}

if (report.length === 0) {
  console.log(`✅ guard-edge-numeric: ${files.length} arquivos, 0 violações.`);
  process.exit(0);
}

console.log(
  `\n⚠️  guard-edge-numeric: ${total} violação(ões) em ${report.length} arquivo(s):\n`,
);
for (const r of report) {
  console.log(`  ${r.file}`);
  for (const v of r.violations) {
    console.log(`    L${v.line} [${v.rule}] ${v.snippet}`);
  }
}
console.log(
  `\nAplique .finite() ou use helpers de supabase/functions/_shared/numeric-schemas.ts.`,
);
console.log(
  `Para coerções, use parseNumericSafely(schema, input, { requestId, functionName, field }).\n`,
);

if (CHECK) process.exit(1);
process.exit(0);
