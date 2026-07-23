/**
 * Utilitários defensivos para parsing numérico.
 *
 * Motivação: `parseInt`, `parseFloat` e `Number(...)` retornam `NaN` para
 * entradas inválidas (strings vazias, texto, `null`, `undefined`). Deixar
 * `NaN` fluir para o estado da aplicação corrompe cálculos downstream
 * (comparações sempre `false`, `toFixed` retornando "NaN", chart libs
 * quebrando). Estas helpers centralizam a proteção em um único lugar,
 * facilitando manutenção e testes property-based.
 */

type NumericInput = string | number | null | undefined;

export interface SafeNumberOptions {
  /** Valor devolvido quando a entrada é inválida ou está fora dos limites. */
  fallback?: number;
  /** Piso inclusivo aplicado após o parse. */
  min?: number;
  /** Teto inclusivo aplicado após o parse. */
  max?: number;
}

function coerceToNumber(input: NumericInput): number {
  if (input === null || input === undefined) return NaN;
  if (typeof input === "number") return input;
  const trimmed = input.trim();
  if (trimmed === "") return NaN;
  // Number() é mais estrito que parseFloat: rejeita "12abc".
  return Number(trimmed);
}

function clamp(value: number, min?: number, max?: number): number {
  let out = value;
  if (typeof min === "number" && out < min) out = min;
  if (typeof max === "number" && out > max) out = max;
  return out;
}

/**
 * Converte uma entrada arbitrária em inteiro seguro.
 * Aplica `Math.trunc` após o parse; NaN/Infinity retornam `fallback`.
 */
export function safeParseInt(
  input: NumericInput,
  options: SafeNumberOptions = {},
): number {
  const { fallback = 0 } = options;
  const n = coerceToNumber(input);
  if (!Number.isFinite(n)) return clamp(fallback, options.min, options.max);
  return clamp(Math.trunc(n), options.min, options.max);
}

/**
 * Converte uma entrada arbitrária em número de ponto flutuante seguro.
 * NaN/Infinity retornam `fallback`.
 */
export function safeParseFloat(
  input: NumericInput,
  options: SafeNumberOptions = {},
): number {
  const { fallback = 0 } = options;
  const n = coerceToNumber(input);
  if (!Number.isFinite(n)) return clamp(fallback, options.min, options.max);
  return clamp(n, options.min, options.max);
}

/**
 * Arredonda `value` para `digits` casas decimais retornando um `number`
 * (nunca "NaN" string). Fallback em caso de entrada inválida.
 */
export function safeToFixed(
  input: NumericInput,
  digits: number,
  fallback = 0,
): number {
  const n = coerceToNumber(input);
  if (!Number.isFinite(n)) return fallback;
  const factor = 10 ** Math.max(0, Math.trunc(digits));
  return Math.round(n * factor) / factor;
}
