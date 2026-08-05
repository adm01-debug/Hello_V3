// Configuração e envio de metadados de exportação para webhook externo.
// Persistência local (por navegador/usuário) — não envolve backend.

const STORAGE_KEY = "security-alerts:webhook-url";
const SECRET_KEY = "security-alerts:webhook-secret";
const MAX_ATTEMPTS_KEY = "security-alerts:webhook-max-attempts";
const BASE_DELAY_KEY = "security-alerts:webhook-base-delay-ms";
const MAX_DELAY_KEY = "security-alerts:webhook-max-delay-ms";

export const WEBHOOK_MAX_ATTEMPTS_MIN = 1;
export const WEBHOOK_MAX_ATTEMPTS_MAX = 6;
export const WEBHOOK_MAX_ATTEMPTS_DEFAULT = 3;

export const WEBHOOK_BASE_DELAY_MIN = 50;
export const WEBHOOK_BASE_DELAY_MAX = 10_000;
export const WEBHOOK_BASE_DELAY_DEFAULT = 400;

export const WEBHOOK_MAX_DELAY_MIN = 100;
export const WEBHOOK_MAX_DELAY_MAX = 60_000;
export const WEBHOOK_MAX_DELAY_DEFAULT = 5_000;

function loadIntClamped(key: string, def: number, min: number, max: number): number {
  if (typeof window === "undefined") return def;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return def;
    const n = safeParseInt(raw);
    if (!Number.isFinite(n)) return def;
    return Math.max(min, Math.min(max, n));
  } catch {
    return def;
  }
}

function saveIntClamped(key: string, n: number, min: number, max: number): void {
  if (typeof window === "undefined") return;
  const clamped = Math.max(min, Math.min(max, Math.floor(n)));
  try {
    window.localStorage.setItem(key, String(clamped));
  } catch {
    /* ignore */
  }
}

export function loadWebhookMaxAttempts(): number {
  return loadIntClamped(MAX_ATTEMPTS_KEY, WEBHOOK_MAX_ATTEMPTS_DEFAULT, WEBHOOK_MAX_ATTEMPTS_MIN, WEBHOOK_MAX_ATTEMPTS_MAX);
}
export function saveWebhookMaxAttempts(n: number): void {
  saveIntClamped(MAX_ATTEMPTS_KEY, n, WEBHOOK_MAX_ATTEMPTS_MIN, WEBHOOK_MAX_ATTEMPTS_MAX);
}
export function loadWebhookBaseDelayMs(): number {
  return loadIntClamped(BASE_DELAY_KEY, WEBHOOK_BASE_DELAY_DEFAULT, WEBHOOK_BASE_DELAY_MIN, WEBHOOK_BASE_DELAY_MAX);
}
export function saveWebhookBaseDelayMs(n: number): void {
  saveIntClamped(BASE_DELAY_KEY, n, WEBHOOK_BASE_DELAY_MIN, WEBHOOK_BASE_DELAY_MAX);
}
export function loadWebhookMaxDelayMs(): number {
  return loadIntClamped(MAX_DELAY_KEY, WEBHOOK_MAX_DELAY_DEFAULT, WEBHOOK_MAX_DELAY_MIN, WEBHOOK_MAX_DELAY_MAX);
}
export function saveWebhookMaxDelayMs(n: number): void {
  saveIntClamped(MAX_DELAY_KEY, n, WEBHOOK_MAX_DELAY_MIN, WEBHOOK_MAX_DELAY_MAX);
}

export interface WebhookExportPayload {
  event: "security_alerts.export";
  filename: string;
  format: "csv" | "pdf";
  count: number;
  scope: "all" | "critical" | "unread";
  filters: {
    source: string | null;
    q: string | null;
    since_iso: string;
  };
  generated_at: string;
}

export function loadWebhookUrl(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveWebhookUrl(url: string): void {
  if (typeof window === "undefined") return;
  const trimmed = url.trim();
  try {
    if (!trimmed) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, trimmed);
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function loadWebhookSecret(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(SECRET_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveWebhookSecret(secret: string): void {
  if (typeof window === "undefined") return;
  const trimmed = secret.trim();
  try {
    if (!trimmed) window.localStorage.removeItem(SECRET_KEY);
    else window.localStorage.setItem(SECRET_KEY, trimmed);
  } catch {
    /* ignore */
  }
}

export function isValidHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Retry: apenas para falhas transitórias (network/timeout, 408, 429, 5xx).
// Backoff exponencial com jitter completo. Nunca retenta 4xx (exceto 408/429).
function isRetriableStatus(status: number): boolean {
  if (status === 0) return true; // network/timeout
  if (status === 408 || status === 429) return true;
  if (status >= 500 && status <= 599) return true;
  return false;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      resolve();
    });
  });
}

import { safeParseInt } from '@/lib/safe-number';
import {
  type WebhookAttemptDetail,
  truncateResponseSnippet,
  pickSafeHeaders,
} from "./security-alerts-webhook-history";

export interface SendExportWebhookResult {
  ok: boolean;
  status: number;
  error?: string;
  signed?: boolean;
  attempts: number;
  /** Correlation id (enviado como X-Lovable-Request-Id). */
  request_id: string;
  /** Trecho da última resposta recebida (pode ser undefined se nunca recebemos resposta). */
  response_snippet?: string;
  /** Headers seguros da última resposta. */
  response_headers?: Record<string, string>;
  /** Trilha por tentativa para auditoria/depuração. */
  attempts_detail: WebhookAttemptDetail[];
}

function generateRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

async function readResponseSnippet(res: Response): Promise<string | undefined> {
  try {
    // Evita travar em bodies gigantes: consumimos e truncamos.
    const text = await res.text();
    return truncateResponseSnippet(text);
  } catch {
    return undefined;
  }
}

// Timeout curto: webhook não deve travar a UX de exportação.
export async function sendExportWebhook(
  url: string,
  payload: WebhookExportPayload,
  options: {
    timeoutMs?: number;
    secret?: string;
    maxAttempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
  } = {},
): Promise<SendExportWebhookResult> {
  const timeoutMs = options.timeoutMs ?? 8000;
  const maxAttempts = Math.max(1, Math.min(6, options.maxAttempts ?? 3));
  const baseDelayMs = options.baseDelayMs ?? 400;
  const maxDelayMs = options.maxDelayMs ?? 5000;
  const request_id = generateRequestId();
  const attempts_detail: WebhookAttemptDetail[] = [];

  if (!isValidHttpUrl(url)) {
    return {
      ok: false,
      status: 0,
      error: "URL inválida",
      attempts: 0,
      request_id,
      attempts_detail,
    };
  }

  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Lovable-Request-Id": request_id,
  };
  let signed = false;
  if (options.secret && options.secret.trim()) {
    try {
      const sig = await hmacSha256Hex(options.secret.trim(), body);
      headers["X-Lovable-Signature"] = `sha256=${sig}`;
      headers["X-Lovable-Timestamp"] = payload.generated_at;
      signed = true;
    } catch {
      /* se HMAC falhar, envia sem assinatura */
    }
  }

  let lastStatus = 0;
  let lastError: string | undefined;
  let lastSnippet: string | undefined;
  let lastHeaders: Record<string, string> | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const started_at = new Date().toISOString();
    const startedMs = performance.now();
    try {
      const res = await fetch(url, { method: "POST", headers, body, signal: controller.signal });
      lastStatus = res.status;
      lastHeaders = pickSafeHeaders(res.headers);
      lastSnippet = await readResponseSnippet(res);
      const duration_ms = Math.round(performance.now() - startedMs);
      if (res.ok) {
        attempts_detail.push({
          attempt,
          started_at,
          duration_ms,
          status: res.status,
          ok: true,
          response_snippet: lastSnippet,
          response_headers: lastHeaders,
        });
        return {
          ok: true,
          status: res.status,
          signed,
          attempts: attempt,
          request_id,
          response_snippet: lastSnippet,
          response_headers: lastHeaders,
          attempts_detail,
        };
      }
      lastError = `HTTP ${res.status}`;
      attempts_detail.push({
        attempt,
        started_at,
        duration_ms,
        status: res.status,
        ok: false,
        error: lastError,
        response_snippet: lastSnippet,
        response_headers: lastHeaders,
      });
      if (!isRetriableStatus(res.status) || attempt === maxAttempts) {
        return {
          ok: false,
          status: res.status,
          error: lastError,
          signed,
          attempts: attempt,
          request_id,
          response_snippet: lastSnippet,
          response_headers: lastHeaders,
          attempts_detail,
        };
      }
    } catch (err) {
      lastStatus = 0;
      lastError =
        err instanceof DOMException && err.name === "AbortError"
          ? `timeout após ${timeoutMs}ms`
          : err instanceof Error
            ? err.message
            : "erro desconhecido";
      const duration_ms = Math.round(performance.now() - startedMs);
      attempts_detail.push({
        attempt,
        started_at,
        duration_ms,
        status: 0,
        ok: false,
        error: lastError,
      });
      if (attempt === maxAttempts) {
        return {
          ok: false,
          status: 0,
          error: lastError,
          signed,
          attempts: attempt,
          request_id,
          response_snippet: lastSnippet,
          response_headers: lastHeaders,
          attempts_detail,
        };
      }
    } finally {
      clearTimeout(timer);
    }
    // Backoff exponencial com jitter completo (AWS full-jitter).
    const expDelay = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
    const delay = Math.floor(Math.random() * expDelay);
    await sleep(delay);
  }

  return {
    ok: false,
    status: lastStatus,
    error: lastError,
    signed,
    attempts: maxAttempts,
    request_id,
    response_snippet: lastSnippet,
    response_headers: lastHeaders,
    attempts_detail,
  };
}

