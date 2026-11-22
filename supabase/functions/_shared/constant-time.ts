/**
 * Comparacao de segredos em tempo constante.
 *
 * `a === b` sai no primeiro byte diferente e vaza o prefixo do token por timing.
 * Usado para validar os bearers que os crons do Vault mandam para as edges
 * (DIALER_CRON_TOKEN, COACHING_CRON_TOKEN, CLEANUP_CRON_TOKEN).
 */
export function mesmaString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
