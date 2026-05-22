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
