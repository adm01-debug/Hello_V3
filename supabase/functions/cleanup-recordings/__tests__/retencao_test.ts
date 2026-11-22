// Regressao da retencao de gravacoes (item C2). Antes desta edge nada apagava
// `call_recordings` nem o bucket `call-recordings`: `database-cleanup` so cobre
// 5 tabelas de seguranca. A regra de negocio e 180 dias.

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { mesmaString } from '../../_shared/constant-time.ts';

const RETENCAO_DIAS = 180;
const TOKEN = '9e1c4f7a2b8d3056c4a1f9e7d2b0c8a6f3e5d7b9c1a2f4e6d8b0c2a4f6e8d0b2';

// Espelha a decisao da edge: o corte e sempre "agora - 180 dias".
const calcularCorte = (agora: number): string =>
  new Date(agora - RETENCAO_DIAS * 24 * 3600 * 1000).toISOString();

const aceitaCron = (authHeader: string, cronToken: string | undefined): boolean =>
  !!cronToken && mesmaString(authHeader, `Bearer ${cronToken}`);

Deno.test('corte de retencao fica exatamente 180 dias atras', () => {
  const agora = Date.parse('2026-11-22T12:00:00.000Z');
  assertEquals(calcularCorte(agora), '2026-05-26T12:00:00.000Z');
});

Deno.test('gravacao com 179 dias ainda nao vence', () => {
  const agora = Date.parse('2026-11-22T12:00:00.000Z');
  const gravada = new Date(agora - 179 * 24 * 3600 * 1000).toISOString();
  assertEquals(gravada < calcularCorte(agora), false);
});

Deno.test('gravacao com 181 dias vence', () => {
  const agora = Date.parse('2026-11-22T12:00:00.000Z');
  const gravada = new Date(agora - 181 * 24 * 3600 * 1000).toISOString();
  assertEquals(gravada < calcularCorte(agora), true);
});

Deno.test('cron: aceita bearer exato do token configurado', () => {
  assertEquals(aceitaCron(`Bearer ${TOKEN}`, TOKEN), true);
});

Deno.test('cron: rejeita quando RECORDINGS_CRON_TOKEN nao esta configurado', () => {
  assertEquals(aceitaCron(`Bearer ${TOKEN}`, undefined), false);
});

Deno.test('cron: rejeita token de outro cron (nao ha reaproveitamento entre edges)', () => {
  const outro = TOKEN.slice(0, -1) + '3';
  assertEquals(aceitaCron(`Bearer ${outro}`, TOKEN), false);
});

Deno.test('cron: rejeita bearer sem prefixo', () => {
  assertEquals(aceitaCron(TOKEN, TOKEN), false);
});
