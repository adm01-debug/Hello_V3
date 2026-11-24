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

/**
 * Índice do delimitador que fecha o que abre em `start` (`{`/`}` ou `(`/`)`),
 * ignorando chaves e parênteses dentro de string/template. Devolve -1 se não
 * fechar. Heurística suficiente para localizar o corpo de um laço: o objetivo é
 * achar `await supabase.from(...)` DENTRO do corpo, não fazer parsing de TS.
 */
function matchDelimiter(code: string, start: number): number {
  const open = code[start];
  const close = open === "{" ? "}" : ")";
  let depth = 0;
  let quote: string | null = null;
  for (let i = start; i < code.length; i++) {
    const ch = code[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

interface Escopo {
  inicio: number;
  fim: number;
}

/** Corpos de `for`, `for await` e `while`, mais os callbacks de array. */
function escoposDeLaco(code: string): Escopo[] {
  const out: Escopo[] = [];
  const laco = /(for\s+await\s*\(|for\s*\(|while\s*\()/g;
  let m: RegExpExecArray | null;
  while ((m = laco.exec(code))) {
    const abreParen = code.indexOf("(", m.index);
    const fechaParen = matchDelimiter(code, abreParen);
    if (fechaParen === -1) continue;
    let i = fechaParen + 1;
    while (i < code.length && /\s/.test(code[i])) i++;
    if (code[i] === "{") {
      const fim = matchDelimiter(code, i);
      if (fim !== -1) out.push({ inicio: i, fim });
    } else {
      // corpo de uma linha só: vai até o `;`
      const fim = code.indexOf(";", i);
      out.push({ inicio: i, fim: fim === -1 ? code.length : fim });
    }
  }
  const callback = /(?<![\w.])(map|forEach|flatMap|reduce|filter)\s*\(/g;
  while ((m = callback.exec(code))) {
    const abreParen = m.index + m[0].length - 1;
    const fechaParen = matchDelimiter(code, abreParen);
    if (fechaParen !== -1) out.push({ inicio: abreParen, fim: fechaParen });
  }
  return out;
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

  // R9 — edge que devolve sucesso sem falar com serviço externo nem com o banco (stub silencioso).
  // Um `{ success: true }` literal só é resposta fabricada quando não há NENHUM trabalho por trás:
  // sem fetch de saída e sem rpc/from/storage do Supabase. `// edge-stub-ok` silencia quando for
  // intencional (ex.: edge que só delega a outro serviço via outra edge).
  const declaraAcao = /action\s*[:=]|case\s+["'][a-z]+["']\s*:/.test(code);
  const devolveSucessoLiteral = /success:\s*true/.test(code);
  const acessaBanco = /\.rpc\s*\(|\.from\s*\(|\.storage\b/.test(code);
  if (devolveSucessoLiteral && declaraAcao && fetches === 0 && !acessaBanco && !/edge-stub-ok/.test(raw)) {
    report(
      "warn",
      "R9-stub",
      rel,
      "declara ação e devolve `success: true` sem fetch: resposta fabricada (use // edge-stub-ok se intencional)",
    );
  }

  // R10 — N+1: ida ao banco (from/rpc) aguardada DENTRO do corpo de um laço ou de um
  // callback de array. Três N+1 reais foram achados por detector ad hoc (etapas 247, 248
  // e 249) e o guard existe para o próximo não passar. É `warn` porque a taxa de falso
  // positivo da heurística é real: acumular em array e fazer UM insert depois do laço é
  // legítimo (check-contact-alerts, check-hold-alerts, voip-failover-notifier,
  // detect-key-moments) e por isso o corpo do laço é extraído por chaves, não por janela
  // de linhas — o insert que vem DEPOIS do laço fica fora do escopo. `// n+1-ok` silencia
  // o caso intencional; esta regra NAO entra no baseline de propósito (warn silenciado
  // nunca é lido).
  if (!/n\+1-ok/.test(raw)) {
    const acessos = /await[^;]*?\b(supabase|supabaseClient|client|db)\s*\.\s*(from|rpc)\s*\(/;
    for (const escopo of escoposDeLaco(code)) {
      const corpo = code.slice(escopo.inicio, escopo.fim);
      if (acessos.test(corpo)) {
        const linha = code.slice(0, escopo.inicio).split("\n").length;
        report(
          "warn",
          "R10-n-plus-1",
          rel,
          `ida ao banco dentro de laço (linha ${linha}): 1 consulta por item (silencio: // n+1-ok)`,
        );
      }
    }
  }
  // R11 — `fetch` de saída sem prazo. As etapas 208-211 zeraram o conjunto; esta
  // regra existe para a próxima edge não nascer sem prazo (o provedor fora do ar
  // penduraria a função até o timeout da plataforma). Use `fetchComPrazo()` de
  // _shared/resilience.ts — ele já injeta o `signal`. NÃO entra no baseline: um
  // achado novo aqui é sempre um bug novo. `// fetch-prazo-ok` silencia.
  if (!/fetch-prazo-ok/.test(raw)) {
    const chamadas = /(?<![\w.$])fetch\s*\(/g;
    let chamada: RegExpExecArray | null;
    while ((chamada = chamadas.exec(code))) {
      const abre = code.indexOf("(", chamada.index);
      const fecha = matchDelimiter(code, abre);
      const args = fecha === -1 ? code.slice(abre) : code.slice(abre, fecha + 1);
      if (/signal/.test(args)) continue;
      const linha = code.slice(0, chamada.index).split("\n").length;
      report(
        "error",
        "R11-fetch-sem-prazo",
        rel,
        `fetch() sem sinal de prazo (linha ${linha}): use fetchComPrazo() de _shared/resilience.ts (silencio: // fetch-prazo-ok)`,
      );
    }
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

const NAO_BASELINEAVEIS = new Set(["R10-n-plus-1", "R11-fetch-sem-prazo"]);
const fresh = findings.filter((f) => NAO_BASELINEAVEIS.has(f.rule) || !baselineSet.has(keyOf(f)));
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