import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { talkRatioStatus } from '../index.ts';

Deno.test('chamada com duração 0 é insuficiente, nunca "optimal"', () => {
  assertEquals(talkRatioStatus(0, 0, 0), 'insufficient_data');
  assertEquals(talkRatioStatus(10, 10, 0), 'insufficient_data');
});

Deno.test('duração positiva sem fala é insuficiente', () => {
  assertEquals(talkRatioStatus(0, 0, 45), 'insufficient_data');
});

Deno.test('NaN do quociente não cai em optimal', () => {
  assertEquals(talkRatioStatus(Number.NaN, 10, 10), 'insufficient_data');
  assertEquals(talkRatioStatus(0, Number.NaN, 10), 'insufficient_data');
  assertEquals(talkRatioStatus(0, 10, Number.NaN), 'insufficient_data');
});

Deno.test('com áudio, classifica pelo intervalo 40–60%', () => {
  assertEquals(talkRatioStatus(30, 100, 100), 'agent_low');
  assertEquals(talkRatioStatus(40, 100, 100), 'optimal');
  assertEquals(talkRatioStatus(60, 100, 100), 'optimal');
  assertEquals(talkRatioStatus(70, 100, 100), 'agent_high');
});
