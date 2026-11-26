import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { detectReplay, normalizePhone, isDuplicateMessageError } from "./idempotency.ts";

Deno.test("mensagem ja gravada com o mesmo message_id vira replay", () => {
  const out = detectReplay(
    "v2",
    { id: "msg-1", conversation_id: "conv-1" },
    null,
  );
  assertEquals(out, {
    success: true,
    idempotent_replay: true,
    conversation_id: "conv-1",
    message_id: "msg-1",
    version: "v2",
  });
});

Deno.test("conversa com external_id igual vira replay sem message_id", () => {
  const out = detectReplay("v1", null, { id: "conv-9" });
  assertEquals(out, {
    success: true,
    idempotent_replay: true,
    conversation_id: "conv-9",
    version: "v1",
  });
});

Deno.test("primeira entrega segue o fluxo normal", () => {
  assertEquals(detectReplay("v1", null, null), null);
  assertEquals(detectReplay("v2", undefined, undefined), null);
});

Deno.test("mensagem ja gravada tem precedencia sobre conversa externa", () => {
  const out = detectReplay("v2", { id: "msg-2", conversation_id: "conv-2" }, { id: "conv-x" });
  assertEquals(out?.conversation_id, "conv-2");
  assertEquals(out?.message_id, "msg-2");
});

Deno.test("normalizePhone remove formatacao", () => {
  assertEquals(normalizePhone("+55 (11) 99999-8888"), "5511999998888");
  assertEquals(normalizePhone("5511999998888"), "5511999998888");
  assertEquals(normalizePhone(""), "");
});

Deno.test("violacao do indice unico do message_id e tratada como reentrega", () => {
  assertEquals(isDuplicateMessageError({ code: "23505" }), true);
  assertEquals(isDuplicateMessageError({ code: "23503" }), false);
  assertEquals(isDuplicateMessageError({ code: undefined }), false);
  assertEquals(isDuplicateMessageError(null), false);
});

Deno.test("corrida de reentregas responde 200 de replay, nao erro", () => {
  // Duas entregas simultaneas: as duas passam pela leitura e o indice barra a segunda.
  const stored = { id: "msg-77", conversation_id: "conv-77" };
  const replay = detectReplay("v2", stored, null);
  assertEquals(replay?.idempotent_replay, true);
  assertEquals(replay?.conversation_id, "conv-77");
  assertEquals(replay?.message_id, "msg-77");
});