import { describe, it, expect } from 'vitest';
import {
  abandonmentRate,
  averageWaitTime,
  serviceLevel,
  type QueueCallSample,
} from '../metrics/queue';

// Os mesmos casos existem em supabase/functions/_shared/queue-metrics_test.ts:
// as duas copias da formula precisam concordar.
const chamada = (status: string, hold: number | null): QueueCallSample => ({
  status,
  hold_time_seconds: hold,
});

describe('serviceLevel', () => {
  it('devolve null para lista vazia', () => {
    expect(serviceLevel([], 20)).toBeNull();
  });

  it('conta atendida dentro do limiar como 100%', () => {
    expect(serviceLevel([chamada('completed', 10)], 20)).toBe(100);
  });

  it('limiar e inclusivo', () => {
    expect(serviceLevel([chamada('completed', 20)], 20)).toBe(100);
    expect(serviceLevel([chamada('completed', 21)], 20)).toBe(0);
  });

  it('abandonada entra no denominador e nao conta como sucesso', () => {
    // 1 atendida em 10s + 1 abandonada = 50%, nao 100%.
    expect(serviceLevel([chamada('completed', 10), chamada('abandoned', 30)], 20)).toBe(50);
  });

  it('todas abandonadas = 0, nao null', () => {
    expect(serviceLevel([chamada('abandoned', 5), chamada('abandoned', 50)], 20)).toBe(0);
  });

  it('ignora chamadas sem espera mensuravel', () => {
    expect(serviceLevel([chamada('completed', 5), chamada('completed', null)], 20)).toBe(100);
  });

  it('devolve null quando nenhuma chamada tem espera mensuravel', () => {
    expect(serviceLevel([chamada('completed', null)], 20)).toBeNull();
  });

  it('rejeita limiar invalido', () => {
    expect(serviceLevel([chamada('completed', 5)], -1)).toBeNull();
    expect(serviceLevel([chamada('completed', 5)], Number.NaN)).toBeNull();
  });
});

describe('abandonmentRate', () => {
  it('devolve null para lista vazia (divisao por zero)', () => {
    expect(abandonmentRate([])).toBeNull();
  });

  it('devolve null quando so ha chamadas sem desfecho', () => {
    expect(abandonmentRate([chamada('missed', 12)])).toBeNull();
  });

  it('1 de 4 = 25%', () => {
    expect(
      abandonmentRate([
        chamada('completed', 5),
        chamada('completed', 9),
        chamada('completed', 7),
        chamada('abandoned', 40),
      ]),
    ).toBe(25);
  });

  it('todas abandonadas = 100', () => {
    expect(abandonmentRate([chamada('abandoned', 5), chamada('abandoned', 6)])).toBe(100);
  });

  it('todas atendidas = 0, nao null', () => {
    expect(abandonmentRate([chamada('completed', 5)])).toBe(0);
  });
});

describe('averageWaitTime', () => {
  it('devolve null para lista vazia', () => {
    expect(averageWaitTime([])).toBeNull();
  });

  it('media simples', () => {
    expect(averageWaitTime([chamada('completed', 10), chamada('abandoned', 20)])).toBe(15);
  });

  it('ignora espera nula sem dividir pelo total', () => {
    expect(averageWaitTime([chamada('completed', 10), chamada('completed', null)])).toBe(10);
  });

  it('devolve null quando ninguem tem espera medida', () => {
    expect(averageWaitTime([chamada('completed', null), chamada('abandoned', null)])).toBeNull();
  });

  it('espera zero e medida valida', () => {
    expect(averageWaitTime([chamada('completed', 0)])).toBe(0);
  });
});
