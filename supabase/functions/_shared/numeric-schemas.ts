import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

/**
 * Schemas Zod defensivos para payloads numéricos.
 *
 * Motivação: `z.number()` sozinho aceita `NaN`, `Infinity` e `-Infinity` — que
 * corrompem cálculos downstream e podem burlar validações de range em SQL.
 * Estes helpers centralizam o filtro `.finite()` + limites usuais em um único
 * ponto, espelhando o `safe-number` do front-end.
 */

/** Número finito genérico. Rejeita NaN/Infinity. */
export const finiteNumber = () => z.number().finite();

/** Inteiro finito. */
export const finiteInt = () => z.number().int().finite();

/** Inteiro não-negativo (>= 0). */
export const nonNegativeInt = () =>
  z.number().int().finite().min(0);

/** Inteiro positivo (>= 1). */
export const positiveInt = () =>
  z.number().int().finite().min(1);

/** Percentual entre 0 e 100 inclusive. */
export const percent = () => z.number().finite().min(0).max(100);

/** Latitude WGS84. */
export const latitude = () => z.number().finite().min(-90).max(90);

/** Longitude WGS84. */
export const longitude = () => z.number().finite().min(-180).max(180);

/** Timestamp Unix em segundos (>= 0, < ano 3000 aprox). */
export const unixTimestamp = () =>
  z.number().int().finite().min(0).max(32_503_680_000);

/** Duração em milissegundos, finita e não negativa. */
export const durationMs = () =>
  z.number().finite().min(0).max(24 * 60 * 60 * 1000 * 365);

/** Valor monetário em centavos, inteiro não negativo. */
export const amountCents = () => nonNegativeInt();

// ─── Instrumentação: rejeições numéricas com correlação por requestId ─────
import { trackMetric, logStructuredError } from "./observability.ts";

export interface NumericRejectionContext {
  requestId?: string;
  functionName?: string;
  field?: string;
}

/**
 * Faz parse com schema Zod e, em caso de erro, emite métrica
 * `numeric_input_rejected` + log estruturado carregando o `requestId`.
 * Retorna `{ ok: true, data }` ou `{ ok: false, error }`.
 */
export async function parseNumericSafely<T>(
  schema: z.ZodType<T>,
  input: unknown,
  ctx: NumericRejectionContext = {},
): Promise<{ ok: true; data: T } | { ok: false; error: z.ZodError }> {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };

  const issues = result.error.issues.map((i) => ({
    path: i.path.join(".") || "(root)",
    code: i.code,
    message: i.message,
  }));

  await trackMetric("numeric_input_rejected", 1, {
    function: ctx.functionName ?? "unknown",
    field: ctx.field ?? "(root)",
    request_id: ctx.requestId ?? "n/a",
    first_issue: issues[0]?.code ?? "unknown",
  });

  logStructuredError("numeric_input_rejected", {
    requestId: ctx.requestId,
    functionName: ctx.functionName,
    field: ctx.field,
    issues,
    // Truncar input para não vazar payloads gigantes nos logs.
    rawInputPreview:
      typeof input === "string" && input.length > 128
        ? `${input.slice(0, 128)}…`
        : input,
  });

  return { ok: false, error: result.error };
}
