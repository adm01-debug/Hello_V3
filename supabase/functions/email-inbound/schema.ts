import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Tetos explicitos em todo campo de texto: o corpo vem do provedor de e-mail (A-129).
export const EmailInboundSchema = z.object({
  from: z.string().min(1).max(320),
  from_name: z.string().max(200).optional(),
  to: z.array(z.string().max(320)).max(50),
  cc: z.array(z.string().max(320)).max(50).optional(),
  subject: z.string().min(1).max(998),
  body_text: z.string().max(200000).optional(),
  body_html: z.string().max(500000).optional(),
  message_id: z.string().min(1).max(998),
  in_reply_to: z.string().max(998).optional(),
  headers: z.record(z.string().max(200)).optional(),
});

export type EmailInbound = z.infer<typeof EmailInboundSchema>;
