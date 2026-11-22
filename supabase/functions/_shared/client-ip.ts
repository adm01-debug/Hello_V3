/**
 * O IP do cliente so pode vir de header HTTP, e header e controlado por quem
 * chama. Antes de usar o valor em URL, log ou decisao de autorizacao, ele
 * precisa ser um IP literal — nunca hostname, porta, path ou query.
 */
export function isIpLiteral(value: string): boolean {
  const candidate = value.trim();
  if (!candidate || candidate.length > 45) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(candidate)) {
    // Comparacao lexicografica de 3 digitos evita coercao numerica (guard-edge-numeric).
    return candidate.split('.').every((octet) => octet.length < 3 || octet <= '255');
  }
  return /^[0-9a-fA-F:]+$/.test(candidate) && candidate.includes(':');
}

/** Retorna o IP do cliente apenas quando ele e um literal valido; senao null. */
export function clientIpFromHeaders(headers: Headers): string | null {
  const candidates = [
    headers.get('cf-connecting-ip'),
    headers.get('x-real-ip'),
    headers.get('x-forwarded-for')?.split(',')[0],
  ];
  for (const raw of candidates) {
    const candidate = raw?.trim();
    if (candidate && isIpLiteral(candidate)) return candidate;
  }
  return null;
}
