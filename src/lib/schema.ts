/**
 * Wrapper central de validação Zod.
 * Ponto único para: schemas canônicos, resolver do React Hook Form,
 * e extração padronizada de erros de formulário (Record<string, string>).
 *
 * Uso em forms RHF:
 *   import { zodResolver } from '@/lib/schema';
 *   const form = useForm({ resolver: zodResolver(someSchema) });
 *
 * Uso em forms controlados (sem RHF):
 *   import { zodFormErrors } from '@/lib/schema';
 *   const errs = zodFormErrors(schema.safeParse(state));
 */
export { zodResolver } from '@hookform/resolvers/zod';
export * from '@/lib/validation/schemas';
export * from '@/lib/validation/contact-schema';
export * from '@/lib/validation/voip-trunk';
export * from '@/lib/validation/auth';

import type { SafeParseReturnType } from 'zod';

/**
 * Converte o resultado de um safeParse em Record<campo, mensagem>.
 * Compatível com forms controlados que exibem erros por campo nativo.
 */
export function zodFormErrors<T>(
  result: SafeParseReturnType<T, T>,
): Record<string, string> {
  if (result.success) return {};
  const errs: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? '_root');
    if (!errs[key]) errs[key] = issue.message;
  }
  return errs;
}