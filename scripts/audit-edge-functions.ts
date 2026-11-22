#!/usr/bin/env bun
/**
 * Auditoria estática das Edge Functions.
 *
 * Verifica invariantes que já causaram bug em produção e que o type-checker não
 * cobre. Usa baseline para não travar a CI com dívida pré-existente: só
 * violações NOVAS falham o pipeline.
 *
 * Uso:
 *   bun scripts/audit-edge-functions.ts                     # falha se houver achado novo
 *   bun scripts/audit-edge-functions.ts --update-baseline   # regrava o baseline
 *   bun scripts/audit-edge-functions.ts --strict            # falha em qualquer achado
 */

import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(process.cwd(), "supabase", "functions");
const BASELINE_PATH = join(process.cwd(), "scripts", "audit-edge-baseline.json");
const STRICT = process.argv.includes("--strict");
const UPDATE = process.argv.includes("--update-baseline");

type Severity = "error" | "warn" | "info";

interface Finding {
  severity: Severity;
  rule: string;
  file: string;
  message: string;
}

const findings: Finding[] = [];

function report(severity: Severity, rule: string, file: string, message: string) {
  findings.push({ severity, rule, file, message });
}

function listEdgeEntrypoints(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (!statSync(full).isDirectory()) continue;
    if (entry.startsWith("_") || entry.startsWith(".")) continue;
    const indexTs = join(full, "index.ts");
    if (existsSync(indexTs)) out.push(indexTs);
  }
  return out;
}

/** Remove comentários de linha para não confundir a heurística de código. */
function stripLineComments(src: string): string {
  return src
    .split("\n")
    .map((line) => {
      const idx = line.indexOf("//");
      return idx === -1 ? line : line.slice(0, idx);
    })
    .join("\n");
}

const SECRET_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{10,}/, label: "JWT hardcoded" },
  { re: /sk-or-v1-[a-f0-9]{20,}/, label: "chave OpenRouter hardcoded" },
  { re: /sk-[A-Za-z0-9]{32,}/, label: "chave de API hardcoded" },
  { re: /sbp_[a-f0-9]{20,}/, label: "token de management do Supabase hardcoded" },
];

const entrypoints = listEdgeEntrypoints(ROOT);
if (entrypoints.length === 0) {
  console.error("❌ Nenhuma Edge Function encontrada em supabase/functions/");
  process.exit(1);
}

for (const file of entrypoints) {
  const rel = relative(process.cwd(), file).replaceAll("\\", "/");
  const raw = readFileSync(file, "utf8");
  const code = stripLineComments(raw);

  // R1 — ponto de entrada Deno.
  if (!/Deno\.serve\s*\(|\bserve\s*\(/.test(code) && !/export\s+const\s+handler/.test(code)) {
    report("error", "R1-entrypoint", rel, "sem Deno.serve/serve e sem export handler: nunca executa");
  }

  // R2 — segredos nunca literais no código.
  for (const { re, label } of SECRET_PATTERNS) {
    if (re.test(raw)) report("error", "R2-secret", rel, `${label} no código-fonte`);
  }

  // R3 — service_role sem validação do chamador. Webhooks e crons são legítimos:
  //      declaram-se com `// edge-public-ok`.
  const usesServiceRole = /SUPABASE_SERVICE_ROLE_KEY/.test(code);
  const validatesCaller =
    /auth\.getUser\s*\(/.test(code) ||
    /jwtVerify|verifyJwt/.test(code) ||
    /HMAC|hmac/.test(code) ||
    /checkRateLimit/.test(code) ||
    /isCron|CRON_SECRET|SERVICE_ROLE_KEY\s*\)\s*\.includes/.test(code);
  const declaredPublic = /edge-public-ok/.test(raw);
  if (usesServiceRole && !validatesCaller && !declaredPublic) {
    report("warn", "R3-auth", rel, "service_role sem validar o chamador (`// edge-public-ok` silencia)");
  }

  // R4 — CORS centralizado.
  if (/Access-Control-Allow-Origin/.test(code) && !/buildCorsHeaders|getCorsOrigin/.test(code)) {
    report("info", "R4-cors", rel, "CORS montado à mão em vez de buildCorsHeaders()");
  }

  // R5 — coerção numérica insegura (complementa guard-edge-numeric.mjs).
  const unsafeNumeric = /(?<![\w.])Number\s*\(/.test(code) || /(?<![\w.])parseFloat\s*\(/.test(code);
  if (unsafeNumeric && !/safe-numeric-ok|parseNumericSafely/.test(raw)) {
    report("info", "R5-numeric", rel, "coerção numérica sem parseNumericSafely");
  }

  // R6 — fetch de saída sem guarda anti-SSRF.
  const fetches = code.match(/fetch\s*\(/g)?.length ?? 0;
  if (fetches > 0 && !/assertSafeOutboundUrl|allowed-hosts/.test(code)) {
    report("info", "R7-ssrf", rel, `${fetches} fetch(es) sem assertSafeOutboundUrl`);
  }

  // R7 — OPTIONS precisa responder, senão o preflight CORS quebra.
  if (!/OPTIONS/.test(code)) {
    report("info", "R8-preflight", rel, "não trata OPTIONS: preflight CORS quebra");
  }
}

function keyOf(f: Finding): string {
  return `${f.rule}|${f.file}`;
}

const baseline: string[] = existsSync(BASELINE_PATH)
  ? (JSON.parse(readFileSync(BASELINE_PATH, "utf8")) as { keys?: string[] }).keys ?? []
  : [];
const baselineSet = new Set(baseline);

if (UPDATE) {
  const keys = [...new Set(findings.map(keyOf))].sort();
  writeFileSync(
    BASELINE_PATH,
    `${JSON.stringify({ generated_at: new Date().toISOString(), keys }, null, 2)}\n`,
  );
  console.log(`Baseline atualizado: ${keys.length} chave(s) em ${relative(process.cwd(), BASELINE_PATH)}`);
  process.exit(0);
}

const fresh = findings.filter((f) => !baselineSet.has(keyOf(f)));
const errors = findings.filter((f) => f.severity === "error");
const freshErrors = fresh.filter((f) => f.severity === "error");

console.log(`Auditoria de Edge Functions - ${entrypoints.length} funcoes analisadas`);
console.log(`Baseline: ${baselineSet.size} achado(s) conhecido(s)\n`);

for (const f of fresh.sort((a, b) => a.severity.localeCompare(b.severity))) {
  console.log(`[${f.severity.toUpperCase()}] ${f.rule} ${f.file}\n    ${f.message}`);
}

const totalNow = new Set(findings.map(keyOf)).size;
console.log(
  `\nResumo: ${totalNow} achado(s) atuais, ${fresh.length} novo(s), ${errors.length} erro(s) (${freshErrors.length} novo(s))`,
);

if (freshErrors.length > 0 || (STRICT && fresh.length > 0) || errors.length > 0) process.exit(1);