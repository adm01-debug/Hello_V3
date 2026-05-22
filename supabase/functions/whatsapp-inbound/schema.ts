import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// V1 Schema
export const WhatsAppInboundV1Schema = z.object({
  from: z.string().min(1, "O campo 'from' é obrigatório"),
  name: z.string().optional(),
  message: z.string().min(1, "O campo 'message' é obrigatório"),
  message_id: z.string().optional(),
  timestamp: z.string().optional(),
  attachments: z.array(z.object({
    url: z.string().url(),
    type: z.string(),
    filename: z.string().optional()
  })).optional()
});

// V2 Schema (Future proofing/Example)
export const WhatsAppInboundV2Schema = WhatsAppInboundV1Schema.extend({
  metadata: z.record(z.unknown()).optional(),
  client_id: z.string().uuid().optional()
});

export type WhatsAppInboundV1 = z.infer<typeof WhatsAppInboundV1Schema>;
export type WhatsAppInboundV2 = z.infer<typeof WhatsAppInboundV2Schema>;
