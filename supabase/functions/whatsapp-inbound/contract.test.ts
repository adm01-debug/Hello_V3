import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { WhatsAppInboundV1Schema } from "./schema.ts";

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
    // missing message
  };
  const result = WhatsAppInboundV1Schema.safeParse(payload);
  assertEquals(result.success, false);
  if (!result.success) {
    assertEquals(result.error.errors[0].path[0], "message");
  }
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
