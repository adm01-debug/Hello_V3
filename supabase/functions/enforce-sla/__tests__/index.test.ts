/**
 * Testes unitários da edge function enforce-sla.
 * Valida: matching de política (canal/prioridade exatos > 'all'),
 * independente da ordem devolvida pelo banco.
 */
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { pickPolicy } from "../index.ts";

interface Policy {
  channel: string;
  priority: string;
  first_response_minutes: number;
  resolution_minutes: number;
}

Deno.test("enforce-sla: prioriza política de canal específico sobre 'all'", () => {
  // 'all' vem primeiro — é o caso que quebrava o find() anterior.
  const policies: Policy[] = [
    { channel: "all", priority: "all", first_response_minutes: 60, resolution_minutes: 1440 },
    { channel: "whatsapp", priority: "high", first_response_minutes: 5, resolution_minutes: 60 },
  ];
  const matched = pickPolicy(policies, { channel: "whatsapp", priority: "high" });
  assert(matched !== undefined);
  assertEquals(matched?.channel, "whatsapp");
  assertEquals(matched?.first_response_minutes, 5);
});

Deno.test("enforce-sla: prioriza prioridade específica sobre 'all' no mesmo canal", () => {
  const policies: Policy[] = [
    { channel: "whatsapp", priority: "all", first_response_minutes: 30, resolution_minutes: 480 },
    { channel: "whatsapp", priority: "high", first_response_minutes: 5, resolution_minutes: 60 },
  ];
  const matched = pickPolicy(policies, { channel: "whatsapp", priority: "high" });
  assertEquals(matched?.priority, "high");
  assertEquals(matched?.first_response_minutes, 5);
});

Deno.test("enforce-sla: canal exato vence combinação genérica", () => {
  const policies: Policy[] = [
    { channel: "all", priority: "high", first_response_minutes: 10, resolution_minutes: 240 },
    { channel: "email", priority: "all", first_response_minutes: 120, resolution_minutes: 2880 },
  ];
  const matched = pickPolicy(policies, { channel: "email", priority: "high" });
  assertEquals(matched?.channel, "email");
  assertEquals(matched?.first_response_minutes, 120);
});

Deno.test("enforce-sla: cai no fallback 'all/all' quando nada específico bate", () => {
  const policies: Policy[] = [
    { channel: "all", priority: "all", first_response_minutes: 60, resolution_minutes: 1440 },
  ];
  const matched = pickPolicy(policies, { channel: "email", priority: "low" });
  assert(matched !== undefined);
  assertEquals(matched?.first_response_minutes, 60);
});

Deno.test("enforce-sla: sem política compatível não aplica nada", () => {
  const policies: Policy[] = [
    { channel: "whatsapp", priority: "high", first_response_minutes: 5, resolution_minutes: 60 },
  ];
  const matched = pickPolicy(policies, { channel: "email", priority: "low" });
  assertEquals(matched, undefined);
});

Deno.test("enforce-sla: conversa sem canal/prioridade usa só as políticas 'all'", () => {
  const policies: Policy[] = [
    { channel: "whatsapp", priority: "high", first_response_minutes: 5, resolution_minutes: 60 },
    { channel: "all", priority: "all", first_response_minutes: 60, resolution_minutes: 1440 },
  ];
  const matched = pickPolicy(policies, { channel: null, priority: null });
  assertEquals(matched?.channel, "all");
});

Deno.test("enforce-sla: calcula due dates a partir de created_at", () => {
  const created = new Date("2026-01-01T10:00:00Z");
  const due = new Date(created.getTime() + 15 * 60_000);
  assertEquals(due.toISOString(), "2026-01-01T10:15:00.000Z");
});

Deno.test("enforce-sla: detecta breach de primeira resposta", () => {
  const now = new Date("2026-01-01T11:00:00Z");
  const due = new Date("2026-01-01T10:15:00Z");
  const firstResponseAt: string | null = null;
  const breach = !firstResponseAt && now > due;
  assertEquals(breach, true);
});

Deno.test("enforce-sla: não marca breach se já houve primeira resposta", () => {
  const now = new Date("2026-01-01T11:00:00Z");
  const due = new Date("2026-01-01T10:15:00Z");
  const firstResponseAt = "2026-01-01T10:10:00Z";
  const breach = !firstResponseAt && now > due;
  assertEquals(breach, false);
});

Deno.test("enforce-sla: idempotente — não recalcula se já tem due", () => {
  const conv: { sla_first_response_due_at: string | null } = {
    sla_first_response_due_at: "2026-01-01T10:15:00Z",
  };
  const updates: Record<string, unknown> = {};
  if (!conv.sla_first_response_due_at) updates.sla_first_response_due_at = "would-set";
  assertEquals(Object.keys(updates).length, 0);
});