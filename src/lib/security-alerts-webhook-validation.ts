/**
 * Validação centralizada da configuração do webhook de exportação.
 *
 * Retorna erros bloqueantes (impedem Salvar/Testar) e avisos não-bloqueantes
 * (destacam risco/config subótima). Todas as mensagens são user-facing em
 * pt-BR e curtas o bastante para caber sob os inputs do diálogo.
 */

import {
  WEBHOOK_MAX_ATTEMPTS_MIN,
  WEBHOOK_MAX_ATTEMPTS_MAX,
  WEBHOOK_BASE_DELAY_MIN,
  WEBHOOK_BASE_DELAY_MAX,
  WEBHOOK_MAX_DELAY_MIN,
  WEBHOOK_MAX_DELAY_MAX,
} from "./security-alerts-webhook";

export const WEBHOOK_URL_MAX_LENGTH = 2048;
export const WEBHOOK_SECRET_MIN_LENGTH = 16;
export const WEBHOOK_SECRET_MAX_LENGTH = 256;

export interface WebhookDraft {
  url: string;
  secret: string;
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export type WebhookField = "url" | "secret" | "maxAttempts" | "baseDelayMs" | "maxDelayMs";

export interface WebhookValidationResult {
  /** Erros por campo — chave presente ⇒ inválido. */
  errors: Partial<Record<WebhookField, string>>;
  /** Avisos por campo — chave presente ⇒ risco/subótimo, mas não bloqueia. */
  warnings: Partial<Record<WebhookField, string>>;
  /** URL "efetiva" ao salvar (trim). "" = remover config. */
  normalizedUrl: string;
  /** Secret efetivo ao salvar (trim). */
  normalizedSecret: string;
}

const PRIVATE_HOST_RE =
  /^(localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|0\.0\.0\.0|169\.254(?:\.\d{1,3}){2}|::1|fe80::.*|fc00::.*)$/i;

function validateUrl(raw: string, out: WebhookValidationResult): void {
  const trimmed = raw.trim();
  out.normalizedUrl = trimmed;
  if (!trimmed) return; // vazio = remover; validado por quem chama Save/Test

  if (trimmed.length > WEBHOOK_URL_MAX_LENGTH) {
    out.errors.url = `URL muito longa (máx ${WEBHOOK_URL_MAX_LENGTH} caracteres).`;
    return;
  }
  if (/\s/.test(trimmed)) {
    out.errors.url = "URL não pode conter espaços.";
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    out.errors.url = "URL inválida — use http(s)://host/caminho.";
    return;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    out.errors.url = `Protocolo "${parsed.protocol.replace(":", "")}" não suportado. Use http ou https.`;
    return;
  }
  if (parsed.username || parsed.password) {
    out.errors.url = "Não inclua usuário/senha na URL (use segredo HMAC).";
    return;
  }
  if (!parsed.hostname) {
    out.errors.url = "Hostname ausente na URL.";
    return;
  }

  // Avisos (não bloqueiam)
  if (parsed.protocol === "http:") {
    out.warnings.url = "Sem TLS — payload trafega em texto puro. Prefira https.";
  } else if (PRIVATE_HOST_RE.test(parsed.hostname)) {
    out.warnings.url = "Host privado/loopback — o receptor pode não estar acessível pela internet.";
  }
}

function validateSecret(raw: string, out: WebhookValidationResult): void {
  const trimmed = raw.trim();
  out.normalizedSecret = trimmed;
  if (!trimmed) return; // opcional

  if (trimmed.length > WEBHOOK_SECRET_MAX_LENGTH) {
    out.errors.secret = `Segredo muito longo (máx ${WEBHOOK_SECRET_MAX_LENGTH} caracteres).`;
    return;
  }
  if (/\s/.test(raw)) {
    out.errors.secret = "Segredo não pode conter espaços.";
    return;
  }
  if (trimmed.length < WEBHOOK_SECRET_MIN_LENGTH) {
    out.warnings.secret = `Segredo curto (${trimmed.length}) — recomendado ≥ ${WEBHOOK_SECRET_MIN_LENGTH} caracteres.`;
  }
}

function validateInt(
  field: WebhookField,
  value: number,
  min: number,
  max: number,
  label: string,
  out: WebhookValidationResult,
): void {
  if (!Number.isFinite(value) || Number.isNaN(value)) {
    out.errors[field] = `${label} deve ser um número.`;
    return;
  }
  if (!Number.isInteger(value)) {
    out.errors[field] = `${label} deve ser inteiro.`;
    return;
  }
  if (value < min || value > max) {
    out.errors[field] = `${label} deve estar entre ${min} e ${max}.`;
  }
}

export function validateWebhookConfig(draft: WebhookDraft): WebhookValidationResult {
  const out: WebhookValidationResult = {
    errors: {},
    warnings: {},
    normalizedUrl: "",
    normalizedSecret: "",
  };

  validateUrl(draft.url, out);
  validateSecret(draft.secret, out);
  validateInt("maxAttempts", draft.maxAttempts, WEBHOOK_MAX_ATTEMPTS_MIN, WEBHOOK_MAX_ATTEMPTS_MAX, "Tentativas", out);
  validateInt("baseDelayMs", draft.baseDelayMs, WEBHOOK_BASE_DELAY_MIN, WEBHOOK_BASE_DELAY_MAX, "Backoff base", out);
  validateInt("maxDelayMs", draft.maxDelayMs, WEBHOOK_MAX_DELAY_MIN, WEBHOOK_MAX_DELAY_MAX, "Backoff máx", out);

  // Coerência entre base/max — não bloqueia (save eleva max), mas avisa.
  if (!out.errors.baseDelayMs && !out.errors.maxDelayMs && draft.maxDelayMs < draft.baseDelayMs) {
    out.warnings.maxDelayMs = `Backoff máx (${draft.maxDelayMs}ms) menor que base (${draft.baseDelayMs}ms) — será elevado ao salvar.`;
  }

  return out;
}

export function hasBlockingErrors(v: WebhookValidationResult): boolean {
  return Object.keys(v.errors).length > 0;
}

/** Formata um resumo compacto de todos os erros — útil em toast agregador. */
export function summarizeErrors(v: WebhookValidationResult): string {
  const parts: string[] = [];
  if (v.errors.url) parts.push(`URL: ${v.errors.url}`);
  if (v.errors.secret) parts.push(`Segredo: ${v.errors.secret}`);
  if (v.errors.maxAttempts) parts.push(v.errors.maxAttempts);
  if (v.errors.baseDelayMs) parts.push(v.errors.baseDelayMs);
  if (v.errors.maxDelayMs) parts.push(v.errors.maxDelayMs);
  return parts.join(" · ");
}
