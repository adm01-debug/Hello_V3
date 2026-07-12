import { describe, it, expect } from "vitest";
import {
  validateWebhookConfig,
  hasBlockingErrors,
  summarizeErrors,
  WEBHOOK_SECRET_MIN_LENGTH,
  type WebhookDraft,
} from "@/lib/security-alerts-webhook-validation";

const base: WebhookDraft = {
  url: "https://example.com/hook",
  secret: "",
  maxAttempts: 3,
  baseDelayMs: 500,
  maxDelayMs: 5000,
};

describe("validateWebhookConfig", () => {
  it("aceita config mínima válida sem erros nem avisos", () => {
    const v = validateWebhookConfig(base);
    expect(v.errors).toEqual({});
    expect(v.warnings).toEqual({});
    expect(hasBlockingErrors(v)).toBe(false);
    expect(v.normalizedUrl).toBe("https://example.com/hook");
  });

  it("aceita URL vazia (= remover config)", () => {
    const v = validateWebhookConfig({ ...base, url: "   " });
    expect(v.errors.url).toBeUndefined();
    expect(v.normalizedUrl).toBe("");
  });

  it.each([
    ["ftp://x.com", "Protocolo"],
    ["not a url", "URL inválida"],
    ["https://user:pass@x.com", "usuário/senha"],
    ["https://x.com com espaço", "espaços"],
  ])("rejeita URL inválida: %s", (url, expected) => {
    const v = validateWebhookConfig({ ...base, url });
    expect(v.errors.url).toBeDefined();
    expect(v.errors.url).toContain(expected);
  });

  it("avisa (não bloqueia) para http sem TLS", () => {
    const v = validateWebhookConfig({ ...base, url: "http://example.com/hook" });
    expect(v.errors.url).toBeUndefined();
    expect(v.warnings.url).toContain("TLS");
  });

  it("avisa (não bloqueia) para host privado/loopback", () => {
    const v = validateWebhookConfig({ ...base, url: "https://127.0.0.1/hook" });
    expect(v.errors.url).toBeUndefined();
    expect(v.warnings.url).toContain("privado");
  });

  it("avisa quando segredo é curto (< min)", () => {
    const v = validateWebhookConfig({ ...base, secret: "curto" });
    expect(v.errors.secret).toBeUndefined();
    expect(v.warnings.secret).toContain(String(WEBHOOK_SECRET_MIN_LENGTH));
  });

  it("rejeita segredo com espaços", () => {
    const v = validateWebhookConfig({ ...base, secret: "abc def ghi jklmn" });
    expect(v.errors.secret).toContain("espaços");
  });

  it.each([
    ["maxAttempts" as const, { maxAttempts: 999 }],
    ["baseDelayMs" as const, { baseDelayMs: 1 }],
    ["maxDelayMs" as const, { maxDelayMs: 999_999 }],
  ])("rejeita %s fora do intervalo", (field, patch) => {
    const v = validateWebhookConfig({ ...base, ...patch });
    expect(v.errors[field]).toBeDefined();
  });

  it("rejeita valores não-inteiros em números", () => {
    const v = validateWebhookConfig({ ...base, maxAttempts: 2.5 });
    expect(v.errors.maxAttempts).toContain("inteiro");
  });

  it("avisa quando max < base (não bloqueia — save eleva)", () => {
    const v = validateWebhookConfig({ ...base, baseDelayMs: 2000, maxDelayMs: 500 });
    expect(v.errors.maxDelayMs).toBeUndefined();
    expect(v.warnings.maxDelayMs).toContain("elevado");
  });

  it("summarizeErrors concatena erros com separador", () => {
    const v = validateWebhookConfig({ ...base, url: "bad", maxAttempts: 999 });
    expect(hasBlockingErrors(v)).toBe(true);
    const s = summarizeErrors(v);
    expect(s).toContain("URL");
    expect(s).toContain("·");
  });
});
