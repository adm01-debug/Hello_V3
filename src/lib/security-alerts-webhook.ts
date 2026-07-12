// Configuração e envio de metadados de exportação para webhook externo.
// Persistência local (por navegador/usuário) — não envolve backend.

const STORAGE_KEY = "security-alerts:webhook-url";

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

export function isValidHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// Timeout curto: webhook não deve travar a UX de exportação.
export async function sendExportWebhook(
  url: string,
  payload: WebhookExportPayload,
  timeoutMs = 8000,
): Promise<{ ok: boolean; status: number; error?: string }> {
  if (!isValidHttpUrl(url)) {
    return { ok: false, status: 0, error: "URL inválida" };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
      // Modo padrão — respeita CORS do endpoint receptor.
    });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    const msg =
      err instanceof DOMException && err.name === "AbortError"
        ? `timeout após ${timeoutMs}ms`
        : err instanceof Error
          ? err.message
          : "erro desconhecido";
    return { ok: false, status: 0, error: msg };
  } finally {
    clearTimeout(timer);
  }
}
