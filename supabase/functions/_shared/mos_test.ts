import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { MOS_THRESHOLDS, classifyMos, isPoorMos } from './mos.ts';

Deno.test('nota 3,55 é mediana (fair), não ruim — mesmo veredito em todas as telas', () => {
  assertEquals(classifyMos(3.55), 'fair');
  assertEquals(isPoorMos(3.55), false);
});

Deno.test('fronteiras dos limiares', () => {
  assertEquals(MOS_THRESHOLDS.poor, 3.5);
  assertEquals(MOS_THRESHOLDS.good, 4.0);
  assertEquals(classifyMos(3.49), 'poor');
  assertEquals(classifyMos(3.5), 'fair');
  assertEquals(classifyMos(4.0), 'good');
  assertEquals(classifyMos(4.3), 'excellent');
});

Deno.test('sem medição não vira nota', () => {
  assertEquals(classifyMos(null), 'unknown');
  assertEquals(classifyMos(undefined), 'unknown');
  assertEquals(classifyMos(Number.NaN), 'unknown');
  assertEquals(isPoorMos(Number.NaN), false);
});
