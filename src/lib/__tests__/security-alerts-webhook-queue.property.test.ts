/**
 * Property-Based Tests para a fila persistente de webhooks.
 *
 * Invariantes verificadas (fast-check, seeds fixos):
 *  - enqueueWebhook nunca faz a fila exceder MAX_QUEUE (50), independentemente
 *    de quantos itens forem enfileirados.
 *  - clearWebhookQueue sempre resulta em fila vazia.
 *  - hashEndpoint é determinístico, com 12 chars hex ([0-9a-f]).
 *  - Após flush com todos os status HTTP 200:
 *      sent === pending_before, failed === 0, remaining === 0.
 *  - Após flush com todos os status 500 (não-ok, retriável): sent === 0,
 *    failed === pending_before, remaining === pending_before, e cada item
 *    remanescente teve attempts incrementado em 1 e possui lastError.
 *  - duration_ms >= 0 e endpoint_hash presente quando havia itens.
 *  - Flush concorrente: chamadas simultâneas nunca duplicam envios (a segunda
 *    entra em curto-circuito enquanto a primeira ainda está em andamento).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fc from "fast-check";
import {
  clearWebhookQueue,
  enqueueWebhook,
  flushWebhookQueue,
  hashEndpoint,
  loadWebhookQueue,
} from "@/lib/security-alerts-webhook-queue";
import type { SendExportWebhookResult, WebhookExportPayload } from "@/lib/security-alerts-webhook";

// O retry/backoff real (jitter) do sendExportWebhook deixa os mocks de fetch
// lentos e não-determinísticos. Mockamos só o envio para testar a lógica pura
// da fila (o retry tem suíte própria em security-alerts-webhook.test.ts).
const { sendExportWebhookMock } = vi.hoisted(() => ({ sendExportWebhookMock: vi.fn<() => Promise<SendExportWebhookResult>>() }));
vi.mock("@/lib/security-alerts-webhook", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/security-alerts-webhook")>();
  return { ...actual, sendExportWebhook: sendExportWebhookMock };
});

const SEED = 20260713;

function payload(overrides: Partial<WebhookExportPayload> = {}): WebhookExportPayload {
  return {
    event: "security_alerts.export",
    filename: "alerts.csv",
    format: "csv",
    count: 1,
    scope: "all",
    filters: { source: null, q: null, since_iso: "2026-01-01T00:00:00.000Z" },
    generated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function okResult(status = 200): SendExportWebhookResult {
  return {
    ok: status >= 200 && status < 300,
    status,
    attempts: 1,
    request_id: "req-test",
    attempts_detail: [],
  };
}

beforeEach(() => {
  localStorage.clear();
  clearWebhookQueue();
  vi.clearAllMocks();
  sendExportWebhookMock.mockResolvedValue(okResult(200));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("security-alerts-webhook-queue — property-based (fast-check)", () => {
  it("enqueue nunca excede MAX_QUEUE (50)", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 200 }), (n) => {
        clearWebhookQueue();
        for (let i = 0; i < n; i++) {
          enqueueWebhook(`https://ex.com/${i}`, payload({ filename: `f${i}.csv` }), false);
        }
        const q = loadWebhookQueue();
        expect(q.length).toBeLessThanOrEqual(50);
        expect(q.length).toBe(Math.min(n, 50));
      }),
      { seed: SEED, numRuns: 40 },
    );
  });

  it("clearWebhookQueue sempre esvazia", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 60 }), (n) => {
        for (let i = 0; i < n; i++) {
          enqueueWebhook(`https://ex.com/${i}`, payload(), false);
        }
        clearWebhookQueue();
        expect(loadWebhookQueue()).toEqual([]);
      }),
      { seed: SEED, numRuns: 30 },
    );
  });

  it("hashEndpoint é determinístico e sempre 12 chars hex", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        (s) => {
          const a = hashEndpoint(s);
          const b = hashEndpoint(s);
          expect(a).toBe(b);
          expect(a).toMatch(/^[0-9a-f]{12}$/);
        },
      ),
      { seed: SEED, numRuns: 200 },
    );
  });

  it("flush com HTTP 200 em todos: sent === pending_before, remaining === 0", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 8 }), async (n) => {
        clearWebhookQueue();
        for (let i = 0; i < n; i++) {
          enqueueWebhook(`https://ok.example.com/${i}`, payload({ filename: `ok${i}.csv` }), false);
        }
        sendExportWebhookMock.mockResolvedValue(okResult(200));
        const r = await flushWebhookQueue();
        expect(r.pending_before).toBe(n);
        expect(r.sent).toBe(n);
        expect(r.failed).toBe(0);
        expect(r.remaining).toBe(0);
        expect(r.duration_ms).toBeGreaterThanOrEqual(0);
        expect(r.endpoint_hash).toMatch(/^[0-9a-f]{12}$/);
        expect(loadWebhookQueue()).toEqual([]);
      }),
      { seed: SEED, numRuns: 20 },
    );
  }, 20000);

  it("flush com HTTP 500 em todos: failed === pending_before, attempts incrementa", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 6 }), async (n) => {
        clearWebhookQueue();
        for (let i = 0; i < n; i++) {
          enqueueWebhook(`https://fail.example.com/${i}`, payload({ filename: `f${i}.csv` }), false);
        }
        sendExportWebhookMock.mockResolvedValue(okResult(500));
        const r = await flushWebhookQueue();
        expect(r.pending_before).toBe(n);
        expect(r.sent).toBe(0);
        expect(r.failed).toBe(n);
        expect(r.remaining).toBe(n);
        const q = loadWebhookQueue();
        expect(q).toHaveLength(n);
        for (const item of q) {
          expect(item.attempts).toBe(1);
          expect(item.lastError).toBeTruthy();
          expect(item.lastTriedAt).toBeTruthy();
        }
      }),
      { seed: SEED, numRuns: 15 },
    );
  }, 30000);

  it("flush concorrente não duplica envios (segunda chamada curto-circuita)", async () => {
    clearWebhookQueue();
    for (let i = 0; i < 3; i++) {
      enqueueWebhook(`https://ok.example.com/${i}`, payload({ filename: `c${i}.csv` }), false);
    }
    sendExportWebhookMock.mockResolvedValue(okResult(200));

    const [a, b] = await Promise.all([flushWebhookQueue(), flushWebhookQueue()]);
    // Um dos dois deve ter processado tudo; o outro é no-op.
    const totalSent = a.sent + b.sent;
    expect(totalSent).toBe(3);
    expect(sendExportWebhookMock).toHaveBeenCalledTimes(3);
    expect(loadWebhookQueue()).toEqual([]);
  }, 15000);
});
