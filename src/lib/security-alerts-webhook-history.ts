// Histórico local (localStorage) dos últimos envios de webhook de exportação.
// Mantém no máximo MAX_ENTRIES entradas ordenadas do mais recente ao mais antigo.

const STORAGE_KEY = "security-alerts:webhook-history:v1";
const MAX_ENTRIES = 20;

export interface WebhookHistoryEntry {
  id: string;
  at: string; // ISO
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
    "latency_ms",
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
      e.latency_ms,
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
