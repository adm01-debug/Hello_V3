// Etapa 141: as quatro combinacoes modo x pais + os casos de borda que nao
// podem ficar silenciosos (modo desconhecido, lista vazia, pais ausente).
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { decideGeoAccess } from '../validate-geo/decide.ts';

Deno.test('allowlist: pais listado e permitido', () => {
  const d = decideGeoAccess('allowlist', 'BR', ['BR', 'PT']);
  assertEquals([d.allowed, d.verdict, d.logReason], [true, 'allowed', 'Country in allowlist']);
});

Deno.test('allowlist: pais fora da lista e bloqueado', () => {
  const d = decideGeoAccess('allowlist', 'US', ['BR', 'PT']);
  assertEquals([d.allowed, d.verdict, d.reason, d.logReason], [
    false,
    'blocked',
    'País não permitido',
    'Country not in allowlist',
  ]);
});

Deno.test('blocklist: pais listado e bloqueado', () => {
  const d = decideGeoAccess('blocklist', 'BR', ['BR', 'PT']);
  assertEquals([d.allowed, d.verdict, d.logReason], [false, 'blocked', 'Country in blocklist']);
});

Deno.test('blocklist: pais fora da lista e permitido', () => {
  const d = decideGeoAccess('blocklist', 'US', ['BR', 'PT']);
  assertEquals([d.allowed, d.verdict, d.logReason], [true, 'allowed', 'Country not in blocklist']);
});

Deno.test('modo desconhecido recusa em vez de escolher um modo', () => {
  for (const modo of [null, undefined, '', 'whitelist', 'allow', 1, {}]) {
    const d = decideGeoAccess(modo, 'BR', ['BR']);
    assertEquals(d.allowed, false, `modo ${JSON.stringify(modo)} deveria recusar`);
    assertEquals(d.verdict, 'invalid_mode');
    assertEquals(d.reason, 'Modo de bloqueio geográfico inválido');
  }
});

Deno.test('lista vazia nao configura nada nos dois modos', () => {
  for (const modo of ['allowlist', 'blocklist'] as const) {
    const d = decideGeoAccess(modo, 'BR', []);
    assertEquals([d.allowed, d.verdict], [true, 'not_configured']);
    assertEquals(d.reason.includes('not configured'), true);
  }
});

Deno.test('pais desconhecido nao bloqueia por falta de dado', () => {
  for (const pais of [null, undefined, '', '   ']) {
    const d = decideGeoAccess('allowlist', pais, ['BR']);
    assertEquals([d.allowed, d.verdict, d.reason], [true, 'unknown_country', 'Country unknown']);
  }
});

Deno.test('comparacao ignora caixa e espacos', () => {
  assertEquals(decideGeoAccess('allowlist', 'br', [' br ', 'PT']).allowed, true);
  assertEquals(decideGeoAccess('blocklist', 'br', ['BR']).allowed, false);
  // Lixo na lista nao vira item valido nem esvazia a lista util.
  assertEquals(decideGeoAccess('allowlist', 'BR', [null as unknown as string, '', 'BR']).allowed, true);
});

Deno.test('allowlist e blocklist dao respostas opostas para a mesma lista', () => {
  const lista = ['BR'];
  assertEquals(decideGeoAccess('allowlist', 'BR', lista).allowed, true);
  assertEquals(decideGeoAccess('blocklist', 'BR', lista).allowed, false);
});