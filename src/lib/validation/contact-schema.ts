/**
 * Schema Zod único para criação/atualização de contatos.
 * Usado tanto pelo formulário (react-hook-form) quanto pelo hook `useContacts`
 * para garantir consistência de tipos e mensagens de erro em PT-BR.
 */
import { z } from 'zod';
import { normalizeBrPhone, stripNonDigits, isE164 } from '@/lib/phone-normalization';

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres`)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v && v.length > 0 ? v : undefined));

export const contactInputSchema = z.object({
  name: z
    .string({ required_error: 'Nome é obrigatório' })
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(120, 'Nome deve ter no máximo 120 caracteres'),
  phone: z
    .string()
    .trim()
    .max(20, 'Telefone deve ter no máximo 20 caracteres')
    .optional()
    .or(z.literal(''))
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .refine(
      (v) => {
        if (!v) return true;
        // aceita E.164 ou BR normalizável
        if (isE164(v)) return true;
        return normalizeBrPhone(v) !== null || stripNonDigits(v).length >= 8;
      },
      { message: 'Telefone inválido' }
    ),
  email: z
    .string()
    .trim()
    .max(254, 'Email muito longo')
    .email('Email inválido')
    .optional()
    .or(z.literal(''))
    .transform((v) => (v && v.length > 0 ? v.toLowerCase() : undefined)),
  company: optionalTrimmed(120),
  position: optionalTrimmed(120),
  notes: optionalTrimmed(2000),
  tags: z
    .array(z.string().trim().min(1).max(40))
    .max(20, 'Máximo de 20 tags')
    .optional(),
  external_id: optionalTrimmed(120),
  source: optionalTrimmed(40),
});

export type ContactInput = z.infer<typeof contactInputSchema>;

/**
 * Mapeia erros do Postgres/Supabase para mensagens amigáveis em PT-BR.
 */
export function mapContactError(err: unknown): string {
  const anyErr = err as { code?: string; message?: string } | null | undefined;
  const code = anyErr?.code;
  const msg = anyErr?.message ?? '';

  if (code === '23505' || /duplicate key|unique constraint/i.test(msg)) {
    return 'Já existe um contato com este telefone ou email';
  }
  if (code === '23502' || /null value in column/i.test(msg)) {
    return 'Campo obrigatório ausente';
  }
  if (code === '23514' || /check constraint/i.test(msg)) {
    return 'Um dos campos possui formato inválido';
  }
  if (code === '42501' || /permission denied|row-level security/i.test(msg)) {
    return 'Você não tem permissão para esta operação';
  }
  if (/OPTIMISTIC_LOCK_CONFLICT/i.test(msg)) {
    return 'Este contato foi alterado por outro usuário';
  }
  return 'Erro ao salvar contato. Tente novamente.';
}
