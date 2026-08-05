import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculatePredictivePace, type PacingInputs } from '@/lib/dialer/predictive-pace';

const inputArb: fc.Arbitrary<PacingInputs> = fc
  .record({
    freeAgents: fc.integer({ min: 0, max: 200 }),
    abandonRate: fc.double({ min: 0, max: 1, noNaN: true }),
    connectRate: fc.double({ min: 0, max: 1, noNaN: true }),
    minPace: fc.integer({ min: 1, max: 20 }),
    delta: fc.integer({ min: 0, max: 80 }),
    currentDelta: fc.integer({ min: 0, max: 80 }),
    targetAbandonRate: fc.double({ min: 0.1, max: 20, noNaN: true }),
  })
  .map(({ freeAgents, abandonRate, connectRate, minPace, delta, currentDelta, targetAbandonRate }) => ({
    freeAgents,
    abandonRate,
    connectRate,
    minPace,
    maxPace: minPace + delta,
    currentPace: minPace + Math.min(delta, currentDelta),
    targetAbandonRate,
  }));

describe('calculatePredictivePace — property-based (1000 runs)', () => {
  it('sugestão sempre dentro de [minPace, maxPace]', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        const { suggested } = calculatePredictivePace(input);
        return suggested >= input.minPace && suggested <= input.maxPace;
      }),
      { numRuns: 1000, seed: 42 },
    );
  });

  it('sem agentes livres → suggested = minPace', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        const { suggested, reason } = calculatePredictivePace({ ...input, freeAgents: 0 });
        return suggested === input.minPace && reason === 'no_free_agents';
      }),
      { numRuns: 500, seed: 7 },
    );
  });

  it('abandono acima do alvo → nunca sobe o pace', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        const forced = { ...input, freeAgents: Math.max(1, input.freeAgents), abandonRate: 0.9, targetAbandonRate: 1 };
        const { suggested } = calculatePredictivePace(forced);
        return suggested <= forced.currentPace;
      }),
      { numRuns: 500, seed: 13 },
    );
  });

  it('minPace = maxPace → suggested = minPace sempre', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        const flat = { ...input, maxPace: input.minPace, currentPace: input.minPace };
        const { suggested } = calculatePredictivePace(flat);
        return suggested === input.minPace;
      }),
      { numRuns: 500, seed: 99 },
    );
  });
});
