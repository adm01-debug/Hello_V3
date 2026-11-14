/**
 * Schema Zod para o formulário de linhas VoIP (VoipTrunkFormDrawer).
 * Extraído do componente para a camada central de validação.
 */
import { z } from 'zod';
import type { VoipProvider } from '@/hooks/useVoipTrunks';

export const voipProviderSchema = z.enum(['nvoip', 'directcall', 'totalvoice', 'generic', 'wavoip']);

export const voipTrunkSchema = z.object({
  name: z.string().trim().min(1, 'Nome obrigatório').max(100),
  provider: voipProviderSchema,
  sip_server: z.string().trim().min(1, 'Servidor obrigatório').max(255),
  sip_username: z.string().trim().min(1, 'Usuário obrigatório').max(100),
  sip_password: z.string().min(0).max(255).optional(),
  sip_realm: z.string().max(255).optional(),
  transport: z.enum(['wss', 'tcp', 'udp']),
  max_channels: z.coerce.number().min(1).max(1000),
  priority: z.coerce.number().min(0).max(9999),
  is_active: z.boolean(),
  notes: z.string().max(500).optional(),
});

export type VoipTrunkInput = z.infer<typeof voipTrunkSchema>;
export type { VoipProvider };