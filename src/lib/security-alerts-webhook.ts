// Configuração e envio de metadados de exportação para webhook externo.
// Persistência local (por navegador/usuário) — não envolve backend.

const STORAGE_KEY = "security-alerts:webhook-url";
const SECRET_KEY = "security-alerts:webhook-secret";

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

export interface SendExportWebhookResult {
  ok: boolean;
  status: number;
  error?: string;
  signed?: boolean;
  attempts: number;
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

  if (!isValidHttpUrl(url)) {
    return { ok: false, status: 0, error: "URL inválida", attempts: 0 };
  }

  const body = JSON.stringify(payload);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
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

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { method: "POST", headers, body, signal: controller.signal });
      lastStatus = res.status;
      if (res.ok) {
        return { ok: true, status: res.status, signed, attempts: attempt };
      }
      lastError = `HTTP ${res.status}`;
      if (!isRetriableStatus(res.status) || attempt === maxAttempts) {
        return { ok: false, status: res.status, error: lastError, signed, attempts: attempt };
      }
    } catch (err) {
      lastStatus = 0;
      lastError =
        err instanceof DOMException && err.name === "AbortError"
          ? `timeout após ${timeoutMs}ms`
          : err instanceof Error
            ? err.message
            : "erro desconhecido";
      if (attempt === maxAttempts) {
        return { ok: false, status: 0, error: lastError, signed, attempts: attempt };
      }
    } finally {
      clearTimeout(timer);
    }
    // Backoff exponencial com jitter completo (AWS full-jitter).
    const expDelay = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
    const delay = Math.floor(Math.random() * expDelay);
    await sleep(delay);
  }

  return { ok: false, status: lastStatus, error: lastError, signed, attempts: maxAttempts };
}
