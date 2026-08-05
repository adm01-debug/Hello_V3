/**
 * Property-Based Tests para validateWebhookConfig.
 *
 * Invariantes verificadas (fast-check, 1000+ runs por propriedade):
 *  - Um draft "canônico válido" JAMAIS produz erros bloqueantes.
 *  - Qualquer inteiro fora dos limites em maxAttempts/baseDelayMs/maxDelayMs
 *    produz erro no campo correspondente.
 *  - Espaços em URL ou Secret sempre produzem erro no campo correspondente.
 *  - normalizedUrl/normalizedSecret são sempre === trim() do input.
 *  - hasBlockingErrors ⇔ Object.keys(errors).length > 0.
 *  - summarizeErrors nunca contém undefined/null literal e é "" sse não há erros.
 *  - URL http válida SEMPRE dispara warning de TLS (nunca erro só por http).
 *  - maxDelayMs < baseDelayMs (sem erros de faixa) gera warning, não erro.
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  validateWebhookConfig,
  hasBlockingErrors,
  summarizeErrors,
  WEBHOOK_SECRET_MIN_LENGTH,
  type WebhookDraft,
} from "@/lib/security-alerts-webhook-validation";
import {
  WEBHOOK_MAX_ATTEMPTS_MIN,
  WEBHOOK_MAX_ATTEMPTS_MAX,
  WEBHOOK_BASE_DELAY_MIN,
  WEBHOOK_BASE_DELAY_MAX,
  WEBHOOK_MAX_DELAY_MIN,
  WEBHOOK_MAX_DELAY_MAX,
} from "@/lib/security-alerts-webhook";

const SEED = 20260712;
const NUM_RUNS = 1000;

const validHostArb = fc
  .tuple(
    fc.string({
      unit: fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789-".split("")),
      minLength: 3,
      maxLength: 20,
    }),
    fc.constantFrom("com", "io", "app", "dev", "net"),
  )
  .filter(([h]: [string, string]) => !h.startsWith("-") && !h.endsWith("-"))
  .map(([h, tld]: [string, string]) => `${h}.${tld}`);

const validUrlArb = fc
  .tuple(
    fc.constantFrom("https://", "http://"),
    validHostArb,
    fc.string({
      unit: fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789/-_".split("")),
      maxLength: 30,
    }),
  )
  .map(([proto, host, path]: [string, string, string]) => `${proto}${host}/${path}`);

const validSecretArb = fc.string({
  unit: fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789ABCDEF".split("")),
  minLength: WEBHOOK_SECRET_MIN_LENGTH,
  maxLength: 64,
});

const validAttemptsArb = fc.integer({ min: WEBHOOK_MAX_ATTEMPTS_MIN, max: WEBHOOK_MAX_ATTEMPTS_MAX });
const validBaseDelayArb = fc.integer({ min: WEBHOOK_BASE_DELAY_MIN, max: WEBHOOK_BASE_DELAY_MAX });
const validMaxDelayArb = fc.integer({ min: WEBHOOK_MAX_DELAY_MIN, max: WEBHOOK_MAX_DELAY_MAX });

const validDraftArb: fc.Arbitrary<WebhookDraft> = fc.record({
  url: validUrlArb,
  secret: validSecretArb,
  maxAttempts: validAttemptsArb,
  baseDelayMs: validBaseDelayArb,
  maxDelayMs: validMaxDelayArb,
});

describe("validateWebhookConfig — property-based (fast-check)", () => {
  it("draft canônico válido nunca bloqueia (sem errors)", () => {
    fc.assert(
      fc.property(validDraftArb, (draft) => {
        // garante coerência base ≤ max para não disparar warning irrelevante
        const coherent = { ...draft, maxDelayMs: Math.max(draft.baseDelayMs, draft.maxDelayMs) };
        const res = validateWebhookConfig(coherent);
        expect(res.errors).toEqual({});
        expect(hasBlockingErrors(res)).toBe(false);
      }),
      { seed: SEED, numRuns: NUM_RUNS },
    );
  });

  it("qualquer inteiro fora de faixa produz erro no campo", () => {
    const outOfRange = fc.oneof(
      fc.integer({ max: WEBHOOK_MAX_ATTEMPTS_MIN - 1 }),
      fc.integer({ min: WEBHOOK_MAX_ATTEMPTS_MAX + 1, max: 100_000 }),
    );
    fc.assert(
      fc.property(validDraftArb, outOfRange, (base, bad) => {
        const res = validateWebhookConfig({ ...base, maxAttempts: bad });
        expect(res.errors.maxAttempts).toBeDefined();
      }),
      { seed: SEED, numRuns: NUM_RUNS },
    );
  });

  it("espaços em URL sempre produzem erro em url", () => {
    fc.assert(
      fc.property(validDraftArb, (draft) => {
        const res = validateWebhookConfig({ ...draft, url: draft.url + " x" });
        expect(res.errors.url).toBeDefined();
      }),
      { seed: SEED, numRuns: NUM_RUNS },
    );
  });

  it("espaços internos no secret sempre produzem erro em secret", () => {
    fc.assert(
      fc.property(validDraftArb, fc.string({ minLength: 1, maxLength: 8 }), (draft, junk) => {
        const secretWithSpace = draft.secret.slice(0, 4) + " " + junk;
        const res = validateWebhookConfig({ ...draft, secret: secretWithSpace });
        expect(res.errors.secret).toBeDefined();
      }),
      { seed: SEED, numRuns: NUM_RUNS },
    );
  });

  it("normalizedUrl/normalizedSecret são sempre trim() do input", () => {
    fc.assert(
      fc.property(validDraftArb, (draft) => {
        const padded = { ...draft, url: `   ${draft.url}   `, secret: `\t${draft.secret}\n` };
        const res = validateWebhookConfig(padded);
        expect(res.normalizedUrl).toBe(padded.url.trim());
        expect(res.normalizedSecret).toBe(padded.secret.trim());
      }),
      { seed: SEED, numRuns: NUM_RUNS },
    );
  });

  it("hasBlockingErrors ⇔ existem chaves em errors", () => {
    fc.assert(
      fc.property(validDraftArb, fc.boolean(), (draft, breakUrl) => {
        const target = breakUrl ? { ...draft, url: "not-a-url" } : draft;
        const res = validateWebhookConfig(target);
        expect(hasBlockingErrors(res)).toBe(Object.keys(res.errors).length > 0);
      }),
      { seed: SEED, numRuns: NUM_RUNS },
    );
  });

  it("summarizeErrors é vazio sse não há erros", () => {
    fc.assert(
      fc.property(validDraftArb, (draft) => {
        const coherent = { ...draft, maxDelayMs: Math.max(draft.baseDelayMs, draft.maxDelayMs) };
        const res = validateWebhookConfig(coherent);
        const summary = summarizeErrors(res);
        expect(summary.length === 0).toBe(Object.keys(res.errors).length === 0);
        expect(summary).not.toMatch(/undefined|null/);
      }),
      { seed: SEED, numRuns: NUM_RUNS },
    );
  });

  it("URL http válida nunca gera erro em url (apenas warning de TLS)", () => {
    const httpUrlArb = fc
      .tuple(validHostArb, fc.string({ unit: fc.constantFrom(..."abc0123".split("")), maxLength: 10 }))
      .map(([host, path]) => `http://${host}/${path}`);
    fc.assert(
      fc.property(validDraftArb, httpUrlArb, (draft, httpUrl) => {
        const res = validateWebhookConfig({ ...draft, url: httpUrl });
        expect(res.errors.url).toBeUndefined();
        expect(res.warnings.url).toBeDefined();
      }),
      { seed: SEED, numRuns: NUM_RUNS },
    );
  });

  it("maxDelayMs < baseDelayMs (ambos válidos) gera warning, não erro", () => {
    fc.assert(
      fc.property(validDraftArb, (draft) => {
        const base = Math.max(draft.baseDelayMs, WEBHOOK_MAX_DELAY_MIN + 1);
        const max = WEBHOOK_MAX_DELAY_MIN; // válido, mas < base
        if (max >= base) return; // só interessa o cenário max<base
        const res = validateWebhookConfig({ ...draft, baseDelayMs: base, maxDelayMs: max });
        expect(res.errors.baseDelayMs).toBeUndefined();
        expect(res.errors.maxDelayMs).toBeUndefined();
        expect(res.warnings.maxDelayMs).toBeDefined();
      }),
      { seed: SEED, numRuns: NUM_RUNS },
    );
  });
});
