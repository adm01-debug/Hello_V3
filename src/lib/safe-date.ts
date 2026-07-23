import { format, formatDistanceToNow, type Locale } from "date-fns";
import { ptBR } from "date-fns/locale";

type DateInput = string | number | Date | null | undefined;

function toValidDate(input: DateInput): Date | null {
  if (input === null || input === undefined || input === "") return null;
  const d = input instanceof Date ? input : new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Formata datas de forma defensiva. Retorna o fallback (default "—") quando a
 * entrada é nula, vazia, não parseável ou resulta em `Invalid Date`.
 * Centraliza a proteção contra `RangeError: Invalid time value` gerado por
 * `date-fns` ao formatar valores corrompidos vindos do backend.
 */
export function safeFormatDate(
  input: DateInput,
  mask: string,
  options?: { locale?: Locale; fallback?: string },
): string {
  const fallback = options?.fallback ?? "—";
  const d = toValidDate(input);
  if (!d) return fallback;
  try {
    return format(d, mask, { locale: options?.locale });
  } catch {
    return fallback;
  }
}

/** Versão pré-configurada com locale pt-BR. */
export function safeFormatDatePtBR(
  input: DateInput,
  mask: string,
  fallback = "—",
): string {
  return safeFormatDate(input, mask, { locale: ptBR, fallback });
}

/** Wrapper defensivo para `formatDistanceToNow` do date-fns. */
export function safeFormatDistanceToNow(
  input: DateInput,
  options?: Parameters<typeof formatDistanceToNow>[1] & { fallback?: string },
): string {
  const fallback = options?.fallback ?? "—";
  const d = toValidDate(input);
  if (!d) return fallback;
  try {
    return formatDistanceToNow(d, options);
  } catch {
    return fallback;
  }
}

/** Wrapper defensivo para `Date#toLocaleString`. */
export function safeToLocaleString(
  input: DateInput,
  locales?: Intl.LocalesArgument,
  options?: Intl.DateTimeFormatOptions & { fallback?: string },
): string {
  const fallback = options?.fallback ?? "—";
  const d = toValidDate(input);
  if (!d) return fallback;
  try {
    const { fallback: _f, ...opts } = options ?? {};
    return d.toLocaleString(locales, opts);
  } catch {
    return fallback;
  }
}

/** Wrapper defensivo para `Date#toLocaleDateString`. */
export function safeToLocaleDateString(
  input: DateInput,
  locales?: Intl.LocalesArgument,
  options?: Intl.DateTimeFormatOptions & { fallback?: string },
): string {
  const fallback = options?.fallback ?? "—";
  const d = toValidDate(input);
  if (!d) return fallback;
  try {
    const { fallback: _f, ...opts } = options ?? {};
    return d.toLocaleDateString(locales, opts);
  } catch {
    return fallback;
  }
}

/** Wrapper defensivo para `Date#toLocaleTimeString`. */
export function safeToLocaleTimeString(
  input: DateInput,
  locales?: Intl.LocalesArgument,
  options?: Intl.DateTimeFormatOptions & { fallback?: string },
): string {
  const fallback = options?.fallback ?? "—";
  const d = toValidDate(input);
  if (!d) return fallback;
  try {
    const { fallback: _f, ...opts } = options ?? {};
    return d.toLocaleTimeString(locales, opts);
  } catch {
    return fallback;
  }
}
