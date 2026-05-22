import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { WhatsAppInboundV1Schema, WhatsAppInboundV2Schema } from "./schema.ts";

Deno.test("WhatsApp Inbound V1 - Valid Payload", () => {
  const payload = {
    from: "5511999999999",
    name: "John Doe",
    message: "Hello world",
    attachments: []
  };
  const result = WhatsAppInboundV1Schema.safeParse(payload);
  assertEquals(result.success, true);
});

Deno.test("WhatsApp Inbound V1 - Missing Required Fields", () => {
  const payload = {
    from: "5511999999999"
  };
  const result = WhatsAppInboundV1Schema.safeParse(payload);
  assertEquals(result.success, false);
});

Deno.test("WhatsApp Inbound V1 - Invalid Attachment URL", () => {
  const payload = {
    from: "5511999999999",
    message: "Check this",
    attachments: [{ url: "not-a-url", type: "image" }]
  };
  const result = WhatsAppInboundV1Schema.safeParse(payload);
  assertEquals(result.success, false);
});

Deno.test("WhatsApp Inbound V2 - Valid Payload (New ID field)", () => {
  const payload = {
    message_id: "msg_123456",
    from: "5511999999999",
    name: "John Doe",
    message: "Hello V2",
    timestamp: new Date().toISOString()
  };
  const result = WhatsAppInboundV2Schema.safeParse(payload);
  assertEquals(result.success, true);
});

Deno.test("WhatsApp Inbound V2 - Missing message_id", () => {
  const payload = {
    from: "5511999999999",
    message: "Hello V2",
    timestamp: new Date().toISOString()
  };
  const result = WhatsAppInboundV2Schema.safeParse(payload);
  assertEquals(result.success, false);
});

Deno.test("WhatsApp Inbound V2 - Invalid Timestamp", () => {
  const payload = {
    message_id: "msg_123",
    from: "5511999999999",
    message: "Hello V2",
    timestamp: "invalid-date"
  };
  const result = WhatsAppInboundV2Schema.safeParse(payload);
  assertEquals(result.success, false);
});

