// Histórico local (localStorage) dos últimos envios de webhook de exportação.
// Mantém no máximo MAX_ENTRIES entradas ordenadas do mais recente ao mais antigo.
// Cada entrada é uma trilha de auditoria detalhada por envio, incluindo cada
// tentativa (timestamp, status HTTP, latência, erro, cabeçalhos relevantes e
// trecho da resposta), a URL de destino e um request_id (X-Lovable-Request-Id)
// gerado no cliente para correlação com logs do receptor.

const STORAGE_KEY = "security-alerts:webhook-history:v1";
const MAX_ENTRIES = 20;
const RESPONSE_SNIPPET_MAX = 500;

export interface WebhookAttemptDetail {
  /** 1-based */
  attempt: number;
  /** ISO timestamp do início da tentativa */
  started_at: string;
  /** ms decorridos até resposta/erro */
  duration_ms: number;
  /** HTTP status (0 quando falha de rede/timeout antes de resposta) */
  status: number;
  ok: boolean;
  /** Mensagem de erro (rede/timeout/HTTP) — presente quando !ok */
  error?: string;
  /** Trecho do corpo da resposta (truncado a RESPONSE_SNIPPET_MAX) */
  response_snippet?: string;
  /** Subconjunto seguro de headers do receptor (content-type, request-id, retry-after…) */
  response_headers?: Record<string, string>;
}

export interface WebhookHistoryEntry {
  id: string;
  at: string; // ISO — timestamp final (encerramento do envio)
  url: string;
  filename: string;
  format: "csv" | "pdf";
  scope: "all" | "critical" | "unread";
  count: number;
  status: number;
  ok: boolean;
  signed: boolean;
  latency_ms: number;
  error?: string;
  kind: "export" | "test";
  attempts?: number;
  /** Correlation id enviado no header X-Lovable-Request-Id */
  request_id?: string;
  /** Trecho do corpo da última resposta (para auditoria/depuração) */
  response_snippet?: string;
  /** Headers relevantes da última resposta */
  response_headers?: Record<string, string>;
  /** Detalhe por tentativa (retries com backoff) */
  attempts_detail?: WebhookAttemptDetail[];
}

function isValid(v: unknown): v is WebhookHistoryEntry {
  if (!v || typeof v !== "object") return false;
  const e = v as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    typeof e.at === "string" &&
    typeof e.url === "string" &&
    typeof e.status === "number" &&
    typeof e.ok === "boolean" &&
    typeof e.latency_ms === "number"
  );
}

export function loadWebhookHistory(): WebhookHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValid);
  } catch {
    return [];
  }
}

export function appendWebhookHistory(entry: Omit<WebhookHistoryEntry, "id" | "at">): WebhookHistoryEntry {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const full: WebhookHistoryEntry = { ...entry, id, at: new Date().toISOString() };
  const next = [full, ...loadWebhookHistory()].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota / privacy — ignore */
  }
  return full;
}

export function clearWebhookHistory(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Trunca uma string a RESPONSE_SNIPPET_MAX preservando o marcador de corte. */
export function truncateResponseSnippet(input: string | undefined | null): string | undefined {
  if (!input) return undefined;
  if (input.length <= RESPONSE_SNIPPET_MAX) return input;
  return `${input.slice(0, RESPONSE_SNIPPET_MAX)}… [truncado ${input.length - RESPONSE_SNIPPET_MAX} chars]`;
}

/** Headers que preservamos na auditoria — evita PII/segredos. */
const SAFE_HEADER_ALLOWLIST = new Set([
  "content-type",
  "content-length",
  "date",
  "server",
  "x-request-id",
  "x-lovable-request-id",
  "x-correlation-id",
  "retry-after",
  "cf-ray",
  "x-ratelimit-remaining",
  "x-ratelimit-limit",
  "x-ratelimit-reset",
]);

/** Extrai apenas headers da allowlist (case-insensitive) para persistência segura. */
export function pickSafeHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (SAFE_HEADER_ALLOWLIST.has(k)) out[k] = value.length > 200 ? `${value.slice(0, 200)}…` : value;
  });
  return out;
}

function csvEscape(value: unknown): string {
  const s = value === undefined || value === null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function webhookHistoryToCSV(entries: WebhookHistoryEntry[]): string {
  const headers = [
    "at",
    "kind",
    "url",
    "filename",
    "format",
    "scope",
    "count",
    "status",
    "ok",
    "signed",
    "attempts",
    "latency_ms",
    "request_id",
    "response_content_type",
    "response_snippet",
    "error",
  ];
  const rows = entries.map((e) =>
    [
      e.at,
      e.kind,
      e.url,
      e.filename,
      e.format,
      e.scope,
      e.count,
      e.status,
      e.ok,
      e.signed,
      e.attempts ?? 1,
      e.latency_ms,
      e.request_id ?? "",
      e.response_headers?.["content-type"] ?? "",
      e.response_snippet ?? "",
      e.error ?? "",
    ]
      .map(csvEscape)
      .join(","),
  );
  return [headers.join(","), ...rows].join("\r\n");
}

export function downloadWebhookHistoryCSV(entries: WebhookHistoryEntry[]): string {
  const csv = webhookHistoryToCSV(entries);
  const filename = `webhook-history-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
  if (typeof window === "undefined") return filename;
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return filename;
}

/** Exporta o histórico completo como NDJSON (uma entrada por linha). Útil para SIEM. */
export function webhookHistoryToNDJSON(entries: WebhookHistoryEntry[]): string {
  return entries.map((e) => JSON.stringify(e)).join("\n");
}

export function downloadWebhookHistoryNDJSON(entries: WebhookHistoryEntry[]): string {
  const nd = webhookHistoryToNDJSON(entries);
  const filename = `webhook-history-${new Date().toISOString().replace(/[:.]/g, "-")}.ndjson`;
  if (typeof window === "undefined") return filename;
  const blob = new Blob([nd], { type: "application/x-ndjson;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return filename;
}

