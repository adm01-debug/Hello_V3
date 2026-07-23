import { format, type Locale } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Formata datas de forma defensiva. Retorna o fallback (default "—") quando a
 * entrada é nula, vazia, não parseável ou resulta em `Invalid Date`.
 * Centraliza a proteção contra `RangeError: Invalid time value` gerado por
 * `date-fns` ao formatar valores corrompidos vindos do backend.
 */
export function safeFormatDate(
  input: string | number | Date | null | undefined,
  mask: string,
  options?: { locale?: Locale; fallback?: string },
): string {
  const fallback = options?.fallback ?? "—";
  if (input === null || input === undefined || input === "") return fallback;
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return fallback;
  try {
    return format(d, mask, { locale: options?.locale });
  } catch {
    return fallback;
  }
}

/** Versão pré-configurada com locale pt-BR. */
export function safeFormatDatePtBR(
  input: string | number | Date | null | undefined,
  mask: string,
  fallback = "—",
): string {
  return safeFormatDate(input, mask, { locale: ptBR, fallback });
}
