/**
 * Property-Based Tests para sendExportWebhook (retry/backoff/HMAC).
 *
 * Invariantes verificadas (fast-check, ≥300 runs por propriedade):
 *  - URL inválida ⇒ { ok:false, status:0, attempts:0, attempts_detail:[] }.
 *  - 4xx não-retriável ⇒ attempts === 1 (exceto 408/429).
 *  - Status retriável persistente ⇒ attempts === maxAttempts e ok=false.
 *  - Primeiro sucesso interrompe a cadeia: attempts_detail.length === attempts,
 *    último item ok=true.
 *  - attempts_detail.length === attempts SEMPRE.
 *  - request_id é string não-vazia e único entre chamadas.
 *  - Com secret não-vazio, header X-Lovable-Signature=sha256=<hex64> é enviado
 *    e result.signed === true.
 *  - Sem secret, nenhum header de assinatura é enviado e signed !== true.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fc from "fast-check";
import {
  sendExportWebhook,
  type WebhookExportPayload,
} from "@/lib/security-alerts-webhook";

const SEED = 20260713;
const NUM_RUNS = 300;

const basePayload: WebhookExportPayload = {
  event: "security_alerts.export",
  filename: "alerts.csv",
  format: "csv",
  count: 1,
  scope: "all",
  filters: { source: null, q: null, since_iso: "2026-01-01T00:00:00.000Z" },
  generated_at: "2026-01-01T00:00:00.000Z",
};

const fastOpts = { timeoutMs: 200, baseDelayMs: 1, maxDelayMs: 1 };

function mockFetchSequence(statuses: number[]): ReturnType<typeof vi.fn> {
  const q = [...statuses];
  const fn = vi.fn(async () => {
    const s = q.shift() ?? statuses[statuses.length - 1];
    return new Response("ok", { status: s, headers: { "content-type": "text/plain" } });
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

beforeEach(() => {
  vi.restoreAllMocks();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("sendExportWebhook — property-based (fast-check)", () => {
  it("URL inválida sempre curto-circuita sem tentativas", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("", "not-a-url", "ftp://x", "javascript:alert(1)", "   "),
        async (badUrl) => {
          const fetchSpy = mockFetchSequence([200]);
          const r = await sendExportWebhook(badUrl, basePayload, fastOpts);
          expect(r.ok).toBe(false);
          expect(r.status).toBe(0);
          expect(r.attempts).toBe(0);
          expect(r.attempts_detail).toEqual([]);
          expect(typeof r.request_id).toBe("string");
          expect(r.request_id.length).toBeGreaterThan(0);
          expect(fetchSpy).not.toHaveBeenCalled();
        },
      ),
      { seed: SEED, numRuns: 50 },
    );
  });

  it("4xx não-retriável (exceto 408/429) ⇒ attempts === 1", async () => {
    const nonRetriable = fc.constantFrom(400, 401, 403, 404, 409, 410, 418, 422);
    await fc.assert(
      fc.asyncProperty(
        nonRetriable,
        fc.integer({ min: 1, max: 6 }),
        async (status, maxAttempts) => {
          mockFetchSequence([status]);
          const r = await sendExportWebhook("https://example.com/hook", basePayload, {
            ...fastOpts,
            maxAttempts,
          });
          expect(r.ok).toBe(false);
          expect(r.status).toBe(status);
          expect(r.attempts).toBe(1);
          expect(r.attempts_detail.length).toBe(1);
        },
      ),
      { seed: SEED, numRuns: NUM_RUNS },
    );
  });

  it("status retriável persistente ⇒ attempts === maxAttempts", async () => {
    const retriable = fc.constantFrom(408, 429, 500, 502, 503, 504);
    await fc.assert(
      fc.asyncProperty(
        retriable,
        fc.integer({ min: 1, max: 4 }),
        async (status, maxAttempts) => {
          mockFetchSequence(Array(maxAttempts).fill(status));
          const r = await sendExportWebhook("https://example.com/hook", basePayload, {
            ...fastOpts,
            maxAttempts,
          });
          expect(r.ok).toBe(false);
          expect(r.attempts).toBe(maxAttempts);
          expect(r.attempts_detail.length).toBe(maxAttempts);
          expect(r.attempts_detail.every((a) => !a.ok)).toBe(true);
        },
      ),
      { seed: SEED, numRuns: 80 },
    );
  });

  it("primeiro sucesso encerra a cadeia; último detail é ok=true", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 4 }), // failuresBefore
        fc.integer({ min: 1, max: 6 }), // maxAttempts (>= failuresBefore+1)
        async (failsRaw, maxRaw) => {
          const fails = Math.min(failsRaw, maxRaw - 1 >= 0 ? maxRaw - 1 : 0);
          const seq = [...Array(fails).fill(503), 200];
          mockFetchSequence(seq);
          const r = await sendExportWebhook("https://example.com/hook", basePayload, {
            ...fastOpts,
            maxAttempts: Math.max(maxRaw, fails + 1),
          });
          expect(r.ok).toBe(true);
          expect(r.attempts).toBe(fails + 1);
          expect(r.attempts_detail.length).toBe(fails + 1);
          expect(r.attempts_detail[r.attempts_detail.length - 1].ok).toBe(true);
        },
      ),
      { seed: SEED, numRuns: 80 },
    );
  });

  it("request_id é sempre string não-vazia e único entre chamadas", async () => {
    mockFetchSequence([200]);
    const ids = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const r = await sendExportWebhook("https://example.com/hook", basePayload, fastOpts);
      expect(r.request_id).toMatch(/.+/);
      ids.add(r.request_id);
    }
    expect(ids.size).toBe(30);
  });

  it("com secret ⇒ header X-Lovable-Signature=sha256=<hex64> e signed=true", async () => {
    const secretArb = fc.string({ minLength: 16, maxLength: 64 }).filter((s) => s.trim().length >= 16);
    await fc.assert(
      fc.asyncProperty(secretArb, async (secret) => {
        const fetchSpy = mockFetchSequence([200]);
        const r = await sendExportWebhook("https://example.com/hook", basePayload, {
          ...fastOpts,
          secret,
        });
        expect(r.ok).toBe(true);
        expect(r.signed).toBe(true);
        const call = fetchSpy.mock.calls[0];
        const headers = (call?.[1] as RequestInit).headers as Record<string, string>;
        expect(headers["X-Lovable-Signature"]).toMatch(/^sha256=[0-9a-f]{64}$/);
        expect(headers["X-Lovable-Timestamp"]).toBe(basePayload.generated_at);
      }),
      { seed: SEED, numRuns: 60 },
    );
  });

  it("sem secret ⇒ nenhum header de assinatura e signed !== true", async () => {
    const fetchSpy = mockFetchSequence([200]);
    const r = await sendExportWebhook("https://example.com/hook", basePayload, fastOpts);
    expect(r.signed).not.toBe(true);
    const headers = (fetchSpy.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers["X-Lovable-Signature"]).toBeUndefined();
    expect(headers["X-Lovable-Timestamp"]).toBeUndefined();
    expect(headers["X-Lovable-Request-Id"]).toBeDefined();
  });
});
