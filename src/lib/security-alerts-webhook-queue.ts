// Fila local (localStorage) de envios de webhook pendentes.
// Enfileira automaticamente quando o envio falha (rede/timeout/5xx/429/etc)
// e reenvia em background ao voltar online ou ao focar a aba.

import {
  loadWebhookBaseDelayMs,
  loadWebhookMaxAttempts,
  loadWebhookMaxDelayMs,
  loadWebhookSecret,
  loadWebhookUrl,
  sendExportWebhook,
  type WebhookExportPayload,
} from "./security-alerts-webhook";
import { appendWebhookHistory } from "./security-alerts-webhook-history";

const QUEUE_KEY = "security-alerts:webhook-queue";
const MAX_QUEUE = 50;

export interface QueuedWebhook {
  id: string;
  url: string;
  hasSecret: boolean;
  payload: WebhookExportPayload;
  enqueuedAt: string;
  lastTriedAt?: string;
  lastError?: string;
  attempts: number; // tentativas de flush já feitas (fora do retry interno)
}

type Listener = (queue: QueuedWebhook[]) => void;
const listeners = new Set<Listener>();

function safeLoad(): QueuedWebhook[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueuedWebhook[]) : [];
  } catch {
    return [];
  }
}

function safeSave(items: QueuedWebhook[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-MAX_QUEUE)));
  } catch {
    /* ignore */
  }
  for (const l of listeners) {
    try {
      l(items);
    } catch {
      /* ignore listener errors */
    }
  }
}

export function loadWebhookQueue(): QueuedWebhook[] {
  return safeLoad();
}

export function clearWebhookQueue(): void {
  safeSave([]);
}

export function removeFromWebhookQueue(id: string): void {
  safeSave(safeLoad().filter((q) => q.id !== id));
}

export function subscribeWebhookQueue(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function enqueueWebhook(
  url: string,
  payload: WebhookExportPayload,
  hasSecret: boolean,
  error?: string,
): void {
  const items = safeLoad();
  items.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url,
    hasSecret,
    payload,
    enqueuedAt: new Date().toISOString(),
    lastError: error,
    attempts: 0,
  });
  safeSave(items);
}

let flushing = false;

export interface WebhookFlushResult {
  sent: number;
  failed: number;
  remaining: number;
  /** Tamanho da fila no início do flush. */
  pending_before: number;
  /** Idade (ms) do item mais antigo no início do flush. */
  oldest_age_ms: number;
  /** Duração total do flush em ms. */
  duration_ms: number;
}

/** Nome do CustomEvent emitido em window ao concluir um flush (para métricas externas). */
export const WEBHOOK_QUEUE_FLUSH_EVENT = "lovable:webhook-queue-flush";

export async function flushWebhookQueue(): Promise<WebhookFlushResult> {
  const emptyResult: WebhookFlushResult = {
    sent: 0,
    failed: 0,
    remaining: safeLoad().length,
    pending_before: safeLoad().length,
    oldest_age_ms: 0,
    duration_ms: 0,
  };
  if (flushing) return emptyResult;
  flushing = true;
  let sent = 0;
  let failed = 0;
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const initialItems = safeLoad();
  const pending_before = initialItems.length;
  const oldest_age_ms = initialItems.length
    ? Date.now() - Math.min(...initialItems.map((q) => new Date(q.enqueuedAt).getTime()))
    : 0;
  try {
    const secret = loadWebhookSecret();
    const maxAttempts = loadWebhookMaxAttempts();
    const baseDelayMs = loadWebhookBaseDelayMs();
    const maxDelayMs = loadWebhookMaxDelayMs();
    const remaining: QueuedWebhook[] = [];
    for (const item of initialItems) {
      // Usa URL atual se o item foi enfileirado com URL antiga vazia.
      const targetUrl = item.url || loadWebhookUrl();
      if (!targetUrl) {
        remaining.push(item);
        continue;
      }
      const start = performance.now();
      const res = await sendExportWebhook(targetUrl, item.payload, {
        secret: item.hasSecret ? secret : undefined,
        maxAttempts,
        baseDelayMs,
        maxDelayMs,
      });
      const latency_ms = Math.round(performance.now() - start);
      appendWebhookHistory({
        url: targetUrl,
        filename: item.payload.filename,
        format: item.payload.format,
        scope: item.payload.scope,
        count: item.payload.count,
        status: res.status,
        ok: res.ok,
        signed: res.signed ?? false,
        latency_ms,
        error: res.error,
        kind: "export",
        attempts: res.attempts,
      });
      if (res.ok) {
        sent++;
      } else {
        failed++;
        remaining.push({
          ...item,
          attempts: item.attempts + 1,
          lastTriedAt: new Date().toISOString(),
          lastError: res.error ?? `HTTP ${res.status}`,
        });
      }
    }
    safeSave(remaining);
    const duration_ms = Math.round(
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0,
    );
    const result: WebhookFlushResult = {
      sent,
      failed,
      remaining: remaining.length,
      pending_before,
      oldest_age_ms,
      duration_ms,
    };
    if (typeof window !== "undefined" && typeof CustomEvent !== "undefined") {
      try {
        window.dispatchEvent(
          new CustomEvent(WEBHOOK_QUEUE_FLUSH_EVENT, { detail: result }),
        );
      } catch {
        /* ignore */
      }
    }
    return result;
  } finally {
    flushing = false;
  }
}


let installed = false;
export function installWebhookQueueAutoFlush(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const trigger = () => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;
    if (safeLoad().length === 0) return;
    void flushWebhookQueue();
  };
  window.addEventListener("online", trigger);
  window.addEventListener("focus", trigger);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") trigger();
  });
  // Tenta um flush inicial no boot.
  setTimeout(trigger, 1500);
}
