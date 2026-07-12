import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WebhookExportPayload } from "../security-alerts-webhook";
import {
  clearWebhookQueue,
  enqueueWebhook,
  flushWebhookQueue,
  loadWebhookQueue,
  subscribeWebhookQueue,
} from "../security-alerts-webhook-queue";

function payload(overrides: Partial<WebhookExportPayload> = {}): WebhookExportPayload {
  return {
    event: "security_alerts.export",
    filename: "test.csv",
    format: "csv",
    count: 1,
    scope: "all",
    filters: { source: null, q: null, since_iso: "2026-01-01T00:00:00Z" },
    generated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("security-alerts-webhook-queue", () => {
  beforeEach(() => {
    localStorage.clear();
    clearWebhookQueue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("enqueues and loads items", () => {
    enqueueWebhook("https://example.com/hook", payload(), false, "boom");
    const q = loadWebhookQueue();
    expect(q).toHaveLength(1);
    expect(q[0].url).toBe("https://example.com/hook");
    expect(q[0].lastError).toBe("boom");
    expect(q[0].attempts).toBe(0);
  });

  it("caps queue at 50 entries", () => {
    for (let i = 0; i < 60; i++) enqueueWebhook(`https://ex/${i}`, payload(), false);
    expect(loadWebhookQueue()).toHaveLength(50);
  });

  it("notifies subscribers on change", () => {
    const spy = vi.fn();
    const unsub = subscribeWebhookQueue(spy);
    enqueueWebhook("https://example.com/hook", payload(), false);
    expect(spy).toHaveBeenCalled();
    unsub();
  });

  it("clearWebhookQueue empties storage", () => {
    enqueueWebhook("https://example.com/hook", payload(), false);
    clearWebhookQueue();
    expect(loadWebhookQueue()).toEqual([]);
  });

  it("flush drains successful sends and keeps failures with attempts++", async () => {
    enqueueWebhook("https://ok.example.com", payload({ filename: "ok.csv" }), false);
    enqueueWebhook("https://fail.example.com", payload({ filename: "fail.csv" }), false);

    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes("ok")) return new Response("", { status: 200 });
      return new Response("nope", { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await flushWebhookQueue();
    expect(res.sent).toBe(1);
    expect(res.failed).toBe(1);
    expect(res.remaining).toBe(1);

    const remaining = loadWebhookQueue();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].url).toBe("https://fail.example.com");
    expect(remaining[0].attempts).toBe(1);
    expect(remaining[0].lastError).toMatch(/HTTP 500/);
  }, 20000);

  it("flush is a no-op with empty queue", async () => {
    const res = await flushWebhookQueue();
    expect(res).toEqual({ sent: 0, failed: 0, remaining: 0 });
  });
});
