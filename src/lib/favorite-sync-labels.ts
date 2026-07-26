/**
 * Rótulos usados ao registrar mudanças de favoritos no histórico de
 * sincronização. O histórico vive em `localStorage`, então o número nunca é
 * gravado por inteiro: apenas os últimos dígitos, o suficiente para o agente
 * reconhecer o contato sem expor o telefone completo na estação.
 */

/** Quantidade de dígitos finais preservados na máscara. */
export const MASK_VISIBLE_DIGITS = 4;

/**
 * Mascara um telefone preservando apenas os últimos dígitos.
 * Nunca lança: entradas inválidas viram `'número desconhecido'`.
 */
export function maskPhone(input: unknown): string {
  if (typeof input !== 'string') return 'número desconhecido';
  const digits = input.replace(/\D/g, '');
  if (digits.length === 0) return 'número desconhecido';
  const tail = digits.slice(-MASK_VISIBLE_DIGITS);
  return `••••${tail}`;
}

/**
 * Detalhe legível de um favorito: rótulo quando houver, senão o número
 * mascarado. O resultado é sempre uma string curta e não vazia.
 */
export function describeFavorite(label: unknown, phone: unknown): string {
  const trimmed = typeof label === 'string' ? label.replace(/\s+/g, ' ').trim() : '';
  if (trimmed.length > 0) return trimmed.slice(0, 40);
  return maskPhone(phone);
}
