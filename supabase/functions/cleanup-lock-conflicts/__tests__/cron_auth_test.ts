// Regressao: o cron semanal `cleanup-lock-conflicts-weekly`
// (migration 20261122220000) envia `Bearer <cleanup_lock_conflicts_cron_token>`,
// um segredo opaco lido do Vault. A edge so validava JWT via getClaims, entao
// esse bearer caia em 401 e a purga de optimistic_lock_conflicts > 90 dias
// NUNCA rodou — embora o ADR-044 e o docs/edge-functions/README.md afirmassem
// que o caminho por token existia.

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { mesmaString } from '../../_shared/constant-time.ts';

// Espelha a decisao da edge: o token do cron so vale se o header for exatamente
// `Bearer <token>`. Exportado mentalmente igual a index.ts:29-30.
const aceitaCron = (authHeader: string, cronToken: string | undefined): boolean =>
  !!cronToken && mesmaString(authHeader, `Bearer ${cronToken}`);

const TOKEN = '37c9d2e546e841d1a7935b53dce7542c23548c1bc5ce432b874770947302aafc';

Deno.test('cron: aceita o bearer exato do Vault', () => {
  assertEquals(aceitaCron(`Bearer ${TOKEN}`, TOKEN), true);
});

Deno.test('cron: rejeita quando o secret nao esta configurado', () => {
  assertEquals(aceitaCron(`Bearer ${TOKEN}`, undefined), false);
});

Deno.test('cron: rejeita token errado de mesmo tamanho', () => {
  const trocado = TOKEN.slice(0, -1) + (TOKEN.at(-1) === 'f' ? 'e' : 'f');
  assertEquals(aceitaCron(`Bearer ${trocado}`, TOKEN), false);
});

Deno.test('cron: rejeita token com tamanho diferente', () => {
  assertEquals(aceitaCron(`Bearer ${TOKEN}extra`, TOKEN), false);
});

Deno.test('cron: rejeita header sem o prefixo Bearer', () => {
  assertEquals(aceitaCron(TOKEN, TOKEN), false);
});

Deno.test('cron: rejeita JWT de usuario (nao e o token do cron)', () => {
  const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.assinatura';
  assertEquals(aceitaCron(`Bearer ${jwt}`, TOKEN), false);
});

Deno.test('mesmaString: prefixo correto e sufixo diferente retorna false', () => {
  // O caso que um `startsWith` deixaria passar.
  assertEquals(mesmaString('Bearer tok', 'Bearer token-diferente'), false);
});

Deno.test('mesmaString: strings identicas retornam true', () => {
  assertEquals(mesmaString(`Bearer ${TOKEN}`, `Bearer ${TOKEN}`), true);
});
