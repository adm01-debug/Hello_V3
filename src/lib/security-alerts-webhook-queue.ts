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
import { addWebhookHistoryEntry } from "./security-alerts-webhook-history";

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

export async function flushWebhookQueue(): Promise<{ sent: number; failed: number; remaining: number }> {
  if (flushing) return { sent: 0, failed: 0, remaining: safeLoad().length };
  flushing = true;
  let sent = 0;
  let failed = 0;
  try {
    const secret = loadWebhookSecret();
    const maxAttempts = loadWebhookMaxAttempts();
    const baseDelayMs = loadWebhookBaseDelayMs();
    const maxDelayMs = loadWebhookMaxDelayMs();
    const items = safeLoad();
    const remaining: QueuedWebhook[] = [];
    for (const item of items) {
      // Usa URL atual se o item foi enfileirado com URL antiga vazia.
      const targetUrl = item.url || loadWebhookUrl();
      if (!targetUrl) {
        remaining.push(item);
        continue;
      }
      const res = await sendExportWebhook(targetUrl, item.payload, {
        secret: item.hasSecret ? secret : undefined,
        maxAttempts,
        baseDelayMs,
        maxDelayMs,
      });
      addWebhookHistoryEntry({
        url: targetUrl,
        status: res.status,
        ok: res.ok,
        signed: res.signed ?? false,
        attempts: res.attempts,
        scope: item.payload.scope,
        format: item.payload.format,
        count: item.payload.count,
        error: res.error,
        source: "queue-flush",
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
    return { sent, failed, remaining: remaining.length };
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
