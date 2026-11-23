import { WhatsAppInboundV1Schema, WhatsAppInboundV2Schema } from './schema.ts';
import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("WhatsAppInboundV1Schema validation", () => {
  const validData = {
    from: "5511999998888",
    name: "John Doe",
    message: "Hello world",
    message_id: "msg_123",
    timestamp: "2024-01-01T12:00:00Z"
  };
  
  const result = WhatsAppInboundV1Schema.safeParse(validData);
  assert(result.success, "Should validate correct V1 payload");
  
  const invalidData = {
    from: "", // Empty phone
    message: "Missing stuff"
  };
  
  const failResult = WhatsAppInboundV1Schema.safeParse(invalidData);
  assert(!failResult.success, "Should fail with empty 'from'");
});

Deno.test("WhatsAppInboundV2Schema versioning", () => {
  const v2Data = {
    from: "5511999998888",
    message: "Version 2 test",
    message_id: "msg_v2_001",
    timestamp: "2024-01-01T12:00:00Z",
    client_id: "550e8400-e29b-41d4-a716-446655440000",
    metadata: {
      custom_field: "test"
    }
  };
  
  const result = WhatsAppInboundV2Schema.safeParse(v2Data);
  assert(result.success, "Should validate V2 payload with uuid");
  assertEquals(result.data.client_id, "550e8400-e29b-41d4-a716-446655440000");
});

Deno.test("Validation error structure check", () => {
  const badData = {
    from: "123",
    message: "", // Required but empty
    attachments: [
      {
        url: "not-a-url",
        type: "image"
      }
    ]
  };
  
  const result = WhatsAppInboundV1Schema.safeParse(badData);
  assert(!result.success);
  
  const errors = result.error.errors;
  const messageError = errors.find(e => e.path[0] === 'message');
  assert(messageError, "Should have error for empty message");
  
  const urlError = errors.find(e => e.path.join('.') === 'attachments.0.url');
  assert(urlError, "Should have error for invalid attachment URL");
});

Deno.test("WhatsAppInboundV1Schema recusa telefone que tenta mexer no filtro PostgREST", () => {
  const tentativas = [
    "5511999999999,id.gt.0",
    "5511999999999)",
    "phone.eq.1",
    "5511 9999-8888",
    "abc12345678",
    "5511999999999\n",
  ];
  for (const ruim of tentativas) {
    const r = WhatsAppInboundV1Schema.safeParse({ from: ruim, message: "oi" });
    assert(!r.success, `deveria recusar from=${JSON.stringify(ruim)}`);
  }
});

Deno.test("WhatsAppInboundV1Schema aceita E.164 com e sem o + inicial", () => {
  for (const bom of ["+5511999999999", "5511999999999", "1199999999"]) {
    const r = WhatsAppInboundV1Schema.safeParse({ from: bom, message: "oi" });
    assert(r.success, `deveria aceitar from=${bom}`);
  }
});

Deno.test("WhatsAppInboundV2Schema herda a validacao de telefone", () => {
  const base = { message: "oi", message_id: "m1", timestamp: "2024-01-01T12:00:00Z" };
  assert(!WhatsAppInboundV2Schema.safeParse({ ...base, from: "1,id.gt.0" }).success);
  assert(WhatsAppInboundV2Schema.safeParse({ ...base, from: "+5511999999999" }).success);
});
