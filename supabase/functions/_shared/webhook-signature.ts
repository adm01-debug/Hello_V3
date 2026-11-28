import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

/** Comparacao em tempo constante: nao vaza o tamanho do prefixo correto. */
function sameString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export type HmacResult = 'valid' | 'invalid' | 'missing' | 'not_configured';

/**
 * Valida HMAC-SHA256 hex do corpo cru do webhook.
 *
 * O corpo tem que ser o `await req.text()` original: `JSON.stringify(await req.json())`
 * muda espacos e ordem de chaves e a assinatura nunca bate.
 *
 * Rollout em duas fases: com `WEBHOOK_ENFORCE_<NOME>_SIGNATURE` diferente de 'true',
 * o resultado invalido apenas loga e o handler segue aceitando (modo observacao).
 */
export async function verifyHmac(
  req: Request,
  rawBody: string,
  secretEnvName: string,
  headerName = 'x-signature',
): Promise<HmacResult & { enforced?: boolean }> {
  const secret = Deno.env.get(secretEnvName);
  const signature = req.headers.get(headerName)?.trim().toLowerCase().replace(/^sha256=/, '') ?? '';
  const enforceEnv = `WEBHOOK_ENFORCE_${secretEnvName.replace(/_SECRET$/, '')}_SIGNATURE`;
  const enforced = Deno.env.get(enforceEnv) === 'true';

  if (!secret) {
    console.warn(`[webhook-signature] ${secretEnvName} ausente: corpo aceito sem verificacao (${enforceEnv}=${enforced})`);
    return 'not_configured';
  }
  if (!signature) {
    console.warn(`[webhook-signature] cabecalho ${headerName} ausente (${enforceEnv}=${enforced})`);
    return 'missing';
  }

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const ok = sameString(signature, expected);
  if (!ok) console.warn(`[webhook-signature] assinatura invalida em ${secretEnvName} (${enforceEnv}=${enforced})`);
  return ok ? 'valid' : 'invalid';
}

/** Assinatura hex esperada, para o provedor conferir/testes. */
export function hmacHex(rawBody: string, secret: string): string {
  return createHmac('sha256', secret).update(rawBody).digest('hex');
}
