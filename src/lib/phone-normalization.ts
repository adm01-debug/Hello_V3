/**
 * Normalização de telefones BR e internacional.
 * Usado por integrações VoIP, Bitrix24, contatos.
 */

/** Remove tudo que não for dígito ou '+' inicial. */
export function stripNonDigits(input: string): string {
  if (typeof input !== 'string') return '';
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Normaliza um número BR para formato E.164 (+55XXXXXXXXXXX).
 * Regras:
 *  - Aceita 10, 11, 12 ou 13 dígitos puros
 *  - 10/11 dígitos => assume DDD nacional, prefixa +55
 *  - 12/13 dígitos iniciando com 55 => prefixa +
 *  - Inválido retorna null
 */
export function normalizeBrPhone(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const cleaned = stripNonDigits(input).replace(/^\+/, '');
  if (!/^\d+$/.test(cleaned)) return null;
  if (cleaned.length === 10 || cleaned.length === 11) {
    return `+55${cleaned}`;
  }
  if ((cleaned.length === 12 || cleaned.length === 13) && cleaned.startsWith('55')) {
    return `+${cleaned}`;
  }
  return null;
}

/**
 * Detecta se um número está em formato E.164 válido (≥8 e ≤15 dígitos com +).
 */
export function isE164(input: string): boolean {
  if (typeof input !== 'string') return false;
  return /^\+[1-9]\d{7,14}$/.test(input);
}

/**
 * Mascara um número para exibição: mantém prefixo e últimos 4 dígitos.
 * Ex: +5511987654321 => +55 11 ****4321
 */
export function maskPhone(input: string): string {
  const cleaned = stripNonDigits(input);
  if (cleaned.length < 4) return cleaned;
  const visible = cleaned.slice(-4);
  const hidden = '*'.repeat(Math.max(0, cleaned.length - 4));
  return `${hidden}${visible}`;
}
