/**
 * Utilitários defensivos para parsing numérico.
 *
 * Motivação: `parseInt`, `parseFloat` e `Number(...)` retornam `NaN` para
 * entradas inválidas (strings vazias, texto, `null`, `undefined`). Deixar
 * `NaN` fluir para o estado da aplicação corrompe cálculos downstream
 * (comparações sempre `false`, `toFixed` retornando "NaN", chart libs
 * quebrando). Estas helpers centralizam a proteção em um único lugar,
 * facilitando manutenção e testes property-based.
 *
 * Instrumentação: toda rejeição (input inválido ou clamp por min/max) é
 * publicada para os subscribers de `onSafeNumberRejection`, permitindo que
 * o logger central e coletores de métricas registrem a ocorrência com
 * correlação por `requestId`.
 */

import { logger, getRequestId } from "./logger";

type NumericInput = string | number | null | undefined;

export type SafeNumberRejectionReason =
  | "null_or_undefined"
  | "empty_string"
  | "not_a_number"
  | "not_finite"
  | "clamped_min"
  | "clamped_max";

export interface SafeNumberRejection {
  helper: "safeParseInt" | "safeParseFloat" | "safeToFixed";
  reason: SafeNumberRejectionReason;
  rawInput: unknown;
  fallback: number;
  min?: number;
  max?: number;
  requestId?: string;
  timestamp: string;
  context?: string;
}

export interface SafeNumberOptions {
  /** Valor devolvido quando a entrada é inválida ou está fora dos limites. */
  fallback?: number;
  /** Piso inclusivo aplicado após o parse. */
  min?: number;
  /** Teto inclusivo aplicado após o parse. */
  max?: number;
  /** Rótulo curto (ex.: "CampaignForm.retries") propagado para logs/métricas. */
  context?: string;
}

// ─── Rejection reporter ────────────────────────────────────────────────────
type Subscriber = (event: SafeNumberRejection) => void;
const subscribers = new Set<Subscriber>();
const counters = new Map<string, number>();

const numericLogger = logger("safe-number");

function emit(event: Omit<SafeNumberRejection, "timestamp" | "requestId">): void {
  const full: SafeNumberRejection = {
    ...event,
    requestId: getRequestId(),
    timestamp: new Date().toISOString(),
  };
  const key = `${full.helper}:${full.reason}`;
  counters.set(key, (counters.get(key) ?? 0) + 1);

  numericLogger.warn(`Rejeição numérica (${full.reason})`, {
    helper: full.helper,
    context: full.context,
    fallback: full.fallback,
    min: full.min,
    max: full.max,
    rawInput: typeof full.rawInput === "string" && full.rawInput.length > 64
      ? `${full.rawInput.slice(0, 64)}…`
      : full.rawInput,
  });

  for (const sub of subscribers) {
    try { sub(full); } catch { /* subscriber isolado, nunca deve derrubar o helper */ }
  }
}

/** Assina rejeições numéricas. Retorna função de unsubscribe. */
export function onSafeNumberRejection(fn: Subscriber): () => void {
  subscribers.add(fn);
  return () => { subscribers.delete(fn); };
}

/** Snapshot dos contadores agregados (para dashboards/testes). */
export function getSafeNumberMetrics(): Record<string, number> {
  return Object.fromEntries(counters);
}

/** Zera os contadores agregados. */
export function resetSafeNumberMetrics(): void {
  counters.clear();
}

// ─── Coerção ───────────────────────────────────────────────────────────────
interface CoerceResult {
  value: number;
  rejection?: SafeNumberRejectionReason;
}

function coerceToNumber(input: NumericInput): CoerceResult {
  if (input === null || input === undefined) {
    return { value: NaN, rejection: "null_or_undefined" };
  }
  if (typeof input === "number") {
    if (Number.isNaN(input)) return { value: NaN, rejection: "not_a_number" };
    if (!Number.isFinite(input)) return { value: input, rejection: "not_finite" };
    return { value: input };
  }
  const trimmed = input.trim();
  if (trimmed === "") return { value: NaN, rejection: "empty_string" };
  const n = Number(trimmed);
  if (Number.isNaN(n)) return { value: NaN, rejection: "not_a_number" };
  if (!Number.isFinite(n)) return { value: n, rejection: "not_finite" };
  return { value: n };
}

interface ClampResult {
  value: number;
  clamped?: "clamped_min" | "clamped_max";
}

function clamp(value: number, min?: number, max?: number): ClampResult {
  if (typeof min === "number" && value < min) return { value: min, clamped: "clamped_min" };
  if (typeof max === "number" && value > max) return { value: max, clamped: "clamped_max" };
  return { value };
}

// ─── Helpers públicos ──────────────────────────────────────────────────────
function runNumeric(
  helper: SafeNumberRejection["helper"],
  input: NumericInput,
  options: SafeNumberOptions,
  transform: (n: number) => number,
): number {
  const { fallback = 0, min, max, context } = options;
  const coerced = coerceToNumber(input);

  if (coerced.rejection) {
    emit({ helper, reason: coerced.rejection, rawInput: input, fallback, min, max, context });
    const clampedFallback = clamp(fallback, min, max);
    return clampedFallback.value;
  }

  const clamped = clamp(transform(coerced.value), min, max);
  if (clamped.clamped) {
    emit({ helper, reason: clamped.clamped, rawInput: input, fallback, min, max, context });
  }
  return clamped.value;
}

/**
 * Converte uma entrada arbitrária em inteiro seguro.
 * Aplica `Math.trunc` após o parse; NaN/Infinity retornam `fallback`.
 */
export function safeParseInt(input: NumericInput, options: SafeNumberOptions = {}): number {
  return runNumeric("safeParseInt", input, options, Math.trunc);
}

/**
 * Converte uma entrada arbitrária em número de ponto flutuante seguro.
 * NaN/Infinity retornam `fallback`.
 */
export function safeParseFloat(input: NumericInput, options: SafeNumberOptions = {}): number {
  return runNumeric("safeParseFloat", input, options, (n) => n);
}

/**
 * Arredonda `value` para `digits` casas decimais retornando um `number`
 * (nunca "NaN" string). Fallback em caso de entrada inválida.
 */
export function safeToFixed(input: NumericInput, digits: number, fallback = 0): number {
  const coerced = coerceToNumber(input);
  if (coerced.rejection) {
    emit({ helper: "safeToFixed", reason: coerced.rejection, rawInput: input, fallback });
    return fallback;
  }
  const factor = 10 ** Math.max(0, Math.trunc(digits));
  return Math.round(coerced.value * factor) / factor;
}
