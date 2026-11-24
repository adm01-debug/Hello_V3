import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Endpoint publico: todo campo de texto tem teto para nao virar custo de IA/armazenamento (A-129).
export const ChatWidgetSessionSchema = z.object({
  action: z.enum(['create', 'send_message', 'fetch_messages']).optional(),
  visitor_token: z.string().max(200).optional(),
  message: z.string().max(4000).optional(),
  visitor_name: z.string().max(200).optional(),
  visitor_email: z.string().max(254).optional(),
  origin_url: z.string().max(500).optional(),
  referrer: z.string().max(500).optional(),
  device_info: z.record(z.unknown()).optional(),
});

export type ChatWidgetSession = z.infer<typeof ChatWidgetSessionSchema>;
