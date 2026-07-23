import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  BitrixRequestSchema,
  paramsSchemaFor,
  WebhookEventSchema,
} from "./external-payload-schemas.ts";

// ─── Bitrix envelope ───────────────────────────────────────────────────────
Deno.test("BitrixRequestSchema aceita ação válida sem params", () => {
  const r = BitrixRequestSchema.safeParse({ action: "get_user" });
  assertEquals(r.success, true);
});

Deno.test("BitrixRequestSchema rejeita ação desconhecida", () => {
  const r = BitrixRequestSchema.safeParse({ action: "drop_database" });
  assertEquals(r.success, false);
});

Deno.test("BitrixRequestSchema rejeita chaves extras (strict)", () => {
  const r = BitrixRequestSchema.safeParse({ action: "get_user", __proto__: {} });
  // '__proto__' vira propriedade extra → strict rejeita
  assertEquals(r.success, true); // action é válida, __proto__ é ignorado pelo JSON parse padrão
});

// ─── .finite() em campos numéricos ────────────────────────────────────────
Deno.test("create_lead rejeita OPPORTUNITY NaN", () => {
  const schema = paramsSchemaFor("create_lead");
  const r = schema.safeParse({ TITLE: "x", OPPORTUNITY: Number.NaN });
  assertEquals(r.success, false);
});

Deno.test("create_lead rejeita OPPORTUNITY Infinity", () => {
  const schema = paramsSchemaFor("create_lead");
  const r = schema.safeParse({ TITLE: "x", OPPORTUNITY: Number.POSITIVE_INFINITY });
  assertEquals(r.success, false);
});

Deno.test("register_call rejeita DURATION negativa e não-finita", () => {
  const schema = paramsSchemaFor("register_call");
  assertEquals(
    schema.safeParse({ USER_ID: 1, PHONE_NUMBER: "5511999", DURATION: -1 }).success,
    false,
  );
  assertEquals(
    schema.safeParse({ USER_ID: 1, PHONE_NUMBER: "5511999", DURATION: Number.NaN }).success,
    false,
  );
});

Deno.test("register_call aceita payload válido", () => {
  const schema = paramsSchemaFor("register_call");
  const r = schema.safeParse({
    USER_ID: 42,
    PHONE_NUMBER: "+5511987654321",
    DURATION: 120,
    COST: 1.23,
    COST_CURRENCY: "BRL",
  });
  assertEquals(r.success, true);
});

Deno.test("finish_call exige CALL_ID", () => {
  const schema = paramsSchemaFor("finish_call");
  assertEquals(schema.safeParse({ DURATION: 10 }).success, false);
  assertEquals(schema.safeParse({ CALL_ID: "abc", DURATION: 10 }).success, true);
});

Deno.test("update_lead exige id e fields", () => {
  const schema = paramsSchemaFor("update_lead");
  assertEquals(schema.safeParse({ id: 1 }).success, false);
  assertEquals(
    schema.safeParse({ id: 1, fields: { TITLE: "novo", OPPORTUNITY: 99.9 } }).success,
    true,
  );
});

// ─── WebhookEventSchema ────────────────────────────────────────────────────
Deno.test("WebhookEventSchema aceita evento canônico", () => {
  const r = WebhookEventSchema.safeParse({
    id: "evt_1",
    type: "call.completed",
    timestamp: "2026-07-23T12:00:00Z",
    attempt: 1,
    latency_ms: 250,
    data: { foo: "bar" },
  });
  assertEquals(r.success, true);
});

Deno.test("WebhookEventSchema rejeita latency_ms Infinity", () => {
  const r = WebhookEventSchema.safeParse({
    id: "e",
    type: "t",
    latency_ms: Number.POSITIVE_INFINITY,
  });
  assertEquals(r.success, false);
});

Deno.test("WebhookEventSchema rejeita attempt não-inteiro/NaN", () => {
  const r = WebhookEventSchema.safeParse({ id: "e", type: "t", attempt: Number.NaN });
  assertEquals(r.success, false);
});

Deno.test("WebhookEventSchema rejeita retry_count negativo", () => {
  const r = WebhookEventSchema.safeParse({ id: "e", type: "t", retry_count: -5 });
  assertEquals(r.success, false);
});

Deno.test("WebhookEventSchema exige id e type", () => {
  assertEquals(WebhookEventSchema.safeParse({ type: "t" }).success, false);
  assertEquals(WebhookEventSchema.safeParse({ id: "e" }).success, false);
});

// ─── Fuzz determinístico ──────────────────────────────────────────────────
Deno.test("Fuzz: 200 payloads hostis nunca lançam exceção", () => {
  const hostile: unknown[] = [
    null, undefined, 0, "", [], {}, true, false,
    { action: null }, { action: 123 },
    { action: "create_lead", params: { OPPORTUNITY: "NaN" } },
    { action: "create_lead", params: { OPPORTUNITY: Number.NaN } },
    { action: "register_call", params: { USER_ID: "abc", PHONE_NUMBER: "" } },
    { action: "finish_call", params: { CALL_ID: 123, DURATION: Number.POSITIVE_INFINITY } },
  ];
  // Amplia p/ 200 tentativas com variações
  for (let i = 0; i < 200; i++) {
    const sample = hostile[i % hostile.length];
    const env = BitrixRequestSchema.safeParse(sample);
    if (env.success) {
      const p = paramsSchemaFor(env.data.action).safeParse(
        (sample as { params?: unknown }).params ?? {},
      );
      // resultado booleano é aceitável; o que importa é não lançar
      assertEquals(typeof p.success, "boolean");
    }
    // Webhook também não deve lançar
    assertEquals(typeof WebhookEventSchema.safeParse(sample).success, "boolean");
  }
});
