import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Tetos explicitos: user_message vai para o prompt e e pago por caractere (A-129).
export const ChatbotRespondSchema = z.object({
  conversation_id: z.string().uuid('conversation_id invalido'),
  user_message: z.string().min(1, 'user_message obrigatorio').max(4000),
  visitor_token: z.string().max(200).optional(),
});

export type ChatbotRespond = z.infer<typeof ChatbotRespondSchema>;
