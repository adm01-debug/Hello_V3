import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  MAX_TTS_RATE,
  MIN_TTS_RATE,
  TTS_RATE_STEPS,
  clampTtsRate,
  formatTtsRate,
  mergeCommandHistories,
  nextTtsRate,
  parseRemoteHistory,
} from '../voice-preferences';
import { MAX_HISTORY_ENTRIES } from '../voice-command-history';

const RUNS = { numRuns: 300, seed: 20260726 } as const;

describe('voice-preferences (PBT)', () => {
  it('clampTtsRate sempre devolve valor finito no intervalo permitido', () => {
    fc.assert(
      fc.property(fc.anything(), (input) => {
        const rate = clampTtsRate(input);
        expect(Number.isFinite(rate)).toBe(true);
        expect(rate).toBeGreaterThanOrEqual(MIN_TTS_RATE);
        expect(rate).toBeLessThanOrEqual(MAX_TTS_RATE);
      }),
      RUNS,
    );
  });

  it('nextTtsRate percorre apenas passos válidos', () => {
    fc.assert(
      fc.property(fc.anything(), (input) => {
        const next = nextTtsRate(input);
        expect(TTS_RATE_STEPS as readonly number[]).toContain(next);
      }),
      RUNS,
    );
  });

  it('ciclo de velocidades é fechado e volta ao início', () => {
    let rate: number = TTS_RATE_STEPS[0];
    for (let i = 0; i < TTS_RATE_STEPS.length; i += 1) rate = nextTtsRate(rate);
    expect(rate).toBe(TTS_RATE_STEPS[0]);
  });

  it('formatTtsRate nunca lança e sempre termina em "x"', () => {
    fc.assert(
      fc.property(fc.anything(), (input) => {
        expect(formatTtsRate(input).endsWith('x')).toBe(true);
      }),
      RUNS,
    );
  });

  it('parseRemoteHistory tolera qualquer payload e respeita o limite', () => {
    fc.assert(
      fc.property(fc.anything(), (input) => {
        const entries = parseRemoteHistory(input);
        expect(Array.isArray(entries)).toBe(true);
        expect(entries.length).toBeLessThanOrEqual(MAX_HISTORY_ENTRIES);
        for (const entry of entries) {
          expect(entry.command.length).toBeGreaterThan(0);
          expect(Number.isFinite(entry.at)).toBe(true);
        }
      }),
      RUNS,
    );
  });

  const entryArb = fc.record({
    command: fc.string({ minLength: 1, maxLength: 40 }),
    at: fc.integer({ min: 1, max: 2_000_000_000_000 }),
  });

  it('mergeCommandHistories: sem duplicatas, ordenado e truncado', () => {
    fc.assert(
      fc.property(fc.array(entryArb, { maxLength: 20 }), fc.array(entryArb, { maxLength: 20 }), (local, remote) => {
        const merged = mergeCommandHistories(local, remote);
        expect(merged.length).toBeLessThanOrEqual(MAX_HISTORY_ENTRIES);
        const keys = merged.map((entry) => entry.command.toLowerCase());
        expect(new Set(keys).size).toBe(keys.length);
        for (let i = 1; i < merged.length; i += 1) {
          expect(merged[i - 1].at).toBeGreaterThanOrEqual(merged[i].at);
        }
      }),
      RUNS,
    );
  });

  it('mergeCommandHistories mantém a ocorrência mais recente do mesmo comando', () => {
    const merged = mergeCommandHistories(
      [{ command: 'Ligar para joão', at: 100 }],
      [{ command: 'LIGAR PARA JOÃO', at: 900 }],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].at).toBe(900);
  });

  it('mergeCommandHistories aceita entradas nulas sem lançar', () => {
    expect(mergeCommandHistories(null, undefined)).toEqual([]);
  });
});
