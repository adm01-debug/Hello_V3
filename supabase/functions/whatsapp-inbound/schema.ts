import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// V1 Schema
// O telefone vai virar filtro de consulta no PostgREST: restringir o alfabeto
// impede que virgula ou `id.gt.0` alterem a gramatica do filtro.
export const PHONE_REGEX = /^\+?[0-9]{8,15}$/;

const phoneSchema = z.string().superRefine((valor, ctx) => {
  if (PHONE_REGEX.test(valor)) return;
  // Log do valor recusado (curto, sem conteudo da mensagem) para descobrir se
  // algum provedor manda formato fora do E.164 antes de apertar de vez.
  console.warn('whatsapp-inbound: from recusado pelo formato', valor.slice(0, 32));
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: "O campo 'from' deve ser um telefone no formato E.164 (8 a 15 digitos, '+' opcional)",
  });
});

export const WhatsAppInboundV1Schema = z.object({
  from: phoneSchema,
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

// V2 exige identificadores de mensagem (message_id/timestamp) - contrato de integracao
export const WhatsAppInboundV2Schema = WhatsAppInboundV1Schema.omit({ message_id: true, timestamp: true }).extend({
  message_id: z.string().min(1, "O campo 'message_id' e obrigatorio no V2"),
  timestamp: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
  client_id: z.string().uuid().optional()
});

export type WhatsAppInboundV1 = z.infer<typeof WhatsAppInboundV1Schema>;
export type WhatsAppInboundV2 = z.infer<typeof WhatsAppInboundV2Schema>;
