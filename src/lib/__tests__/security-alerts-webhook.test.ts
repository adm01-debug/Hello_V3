import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  sendExportWebhook,
  isValidHttpUrl,
  loadWebhookUrl,
  saveWebhookUrl,
  loadWebhookMaxAttempts,
  saveWebhookMaxAttempts,
  WEBHOOK_MAX_ATTEMPTS_MAX,
  type WebhookExportPayload,
} from "@/lib/security-alerts-webhook";

const basePayload: WebhookExportPayload = {
  event: "security_alerts.export",
  filename: "alerts.csv",
  format: "csv",
  count: 1,
  scope: "all",
  filters: { source: null, q: null, since_iso: "2026-01-01T00:00:00Z" },
  generated_at: "2026-07-12T00:00:00Z",
};

function mockFetchSequence(responses: Array<Response | Error>) {
  const fn = vi.fn();
  for (const r of responses) {
    if (r instanceof Error) fn.mockRejectedValueOnce(r);
    else fn.mockResolvedValueOnce(r);
  }
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe("security-alerts-webhook", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
    // Determinismo do jitter (backoff = 0ms)
    vi.spyOn(Math, "random").mockReturnValue(0);
  });
  afterEach(() => vi.restoreAllMocks());

  describe("isValidHttpUrl", () => {
    it("aceita http/https e rejeita esquemas inválidos", () => {
      expect(isValidHttpUrl("https://ex.com/hook")).toBe(true);
      expect(isValidHttpUrl("http://ex.com")).toBe(true);
      expect(isValidHttpUrl("ftp://ex.com")).toBe(false);
      expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
      expect(isValidHttpUrl("not a url")).toBe(false);
      expect(isValidHttpUrl("")).toBe(false);
    });
  });

  describe("persistência (URL / retries)", () => {
    it("salva e recupera URL, removendo quando vazia", () => {
      saveWebhookUrl("https://hook.site/abc");
      expect(loadWebhookUrl()).toBe("https://hook.site/abc");
      saveWebhookUrl("   ");
      expect(loadWebhookUrl()).toBe("");
    });

    it("clampa maxAttempts ao range permitido", () => {
      saveWebhookMaxAttempts(999);
      expect(loadWebhookMaxAttempts()).toBe(WEBHOOK_MAX_ATTEMPTS_MAX);
      saveWebhookMaxAttempts(-5);
      expect(loadWebhookMaxAttempts()).toBe(1);
    });
  });

  describe("sendExportWebhook", () => {
    it("retorna ok=false imediatamente para URL inválida (sem fetch)", async () => {
      const fetchMock = mockFetchSequence([]);
      const res = await sendExportWebhook("not-a-url", basePayload);
      expect(res).toMatchObject({ ok: false, status: 0, error: "URL inválida", attempts: 0 });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("sucesso na primeira tentativa (ok=true, attempts=1)", async () => {
      const fetchMock = mockFetchSequence([new Response(null, { status: 200 })]);
      const res = await sendExportWebhook("https://ex.com/hook", basePayload, {
        maxAttempts: 3,
        baseDelayMs: 1,
        maxDelayMs: 1,
      });
      expect(res.ok).toBe(true);
      expect(res.status).toBe(200);
      expect(res.attempts).toBe(1);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [, init] = fetchMock.mock.calls[0];
      expect((init as RequestInit).method).toBe("POST");
      expect(JSON.parse((init as RequestInit).body as string)).toMatchObject({
        event: "security_alerts.export",
      });
    });

    it("não retenta 4xx não-retriáveis (400) e retorna erro", async () => {
      const fetchMock = mockFetchSequence([new Response(null, { status: 400 })]);
      const res = await sendExportWebhook("https://ex.com", basePayload, {
        maxAttempts: 3,
        baseDelayMs: 1,
        maxDelayMs: 1,
      });
      expect(res.ok).toBe(false);
      expect(res.status).toBe(400);
      expect(res.attempts).toBe(1);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("retenta 5xx e retorna sucesso quando um dos retries funciona", async () => {
      const fetchMock = mockFetchSequence([
        new Response(null, { status: 503 }),
        new Response(null, { status: 502 }),
        new Response(null, { status: 200 }),
      ]);
      const res = await sendExportWebhook("https://ex.com", basePayload, {
        maxAttempts: 3,
        baseDelayMs: 1,
        maxDelayMs: 1,
      });
      expect(res.ok).toBe(true);
      expect(res.attempts).toBe(3);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("retenta 429 e falha após esgotar tentativas", async () => {
      const fetchMock = mockFetchSequence([
        new Response(null, { status: 429 }),
        new Response(null, { status: 429 }),
      ]);
      const res = await sendExportWebhook("https://ex.com", basePayload, {
        maxAttempts: 2,
        baseDelayMs: 1,
        maxDelayMs: 1,
      });
      expect(res.ok).toBe(false);
      expect(res.status).toBe(429);
      expect(res.attempts).toBe(2);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("trata falha de rede como retriável", async () => {
      const fetchMock = mockFetchSequence([
        new TypeError("network"),
        new Response(null, { status: 200 }),
      ]);
      const res = await sendExportWebhook("https://ex.com", basePayload, {
        maxAttempts: 2,
        baseDelayMs: 1,
        maxDelayMs: 1,
      });
      expect(res.ok).toBe(true);
      expect(res.attempts).toBe(2);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("assina o payload quando secret informado (X-Lovable-Signature)", async () => {
      // Stub HMAC — o setup global não expõe importKey/sign
      const importKey = vi.fn().mockResolvedValue({});
      const sign = vi.fn().mockResolvedValue(new Uint8Array([0xab, 0xcd]).buffer);
      Object.defineProperty(globalThis.crypto, "subtle", {
        configurable: true,
        value: { importKey, sign },
      });
      const fetchMock = mockFetchSequence([new Response(null, { status: 204 })]);
      const res = await sendExportWebhook("https://ex.com", basePayload, {
        secret: "s3cret",
        maxAttempts: 1,
        baseDelayMs: 1,
        maxDelayMs: 1,
      });
      expect(res.ok).toBe(true);
      expect(res.signed).toBe(true);
      const [, init] = fetchMock.mock.calls[0];
      const headers = (init as RequestInit).headers as Record<string, string>;
      expect(headers["X-Lovable-Signature"]).toBe("sha256=abcd");
      expect(headers["X-Lovable-Timestamp"]).toBe(basePayload.generated_at);
    });

    it("envia sem assinatura se HMAC lançar exceção", async () => {
      Object.defineProperty(globalThis.crypto, "subtle", {
        configurable: true,
        value: {
          importKey: vi.fn().mockRejectedValue(new Error("no crypto")),
          sign: vi.fn(),
        },
      });
      const fetchMock = mockFetchSequence([new Response(null, { status: 200 })]);
      const res = await sendExportWebhook("https://ex.com", basePayload, {
        secret: "s3cret",
        maxAttempts: 1,
      });
      expect(res.ok).toBe(true);
      expect(res.signed).toBeFalsy();
      const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
      expect(headers["X-Lovable-Signature"]).toBeUndefined();
    });
  });
});
