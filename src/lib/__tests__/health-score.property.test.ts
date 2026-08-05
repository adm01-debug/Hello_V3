import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { computeHealth, healthTier, type HealthInputs } from '@/lib/health-score';

const inputArb: fc.Arbitrary<HealthInputs> = fc.record({
  hasTrunk: fc.boolean(),
  trunkOnline: fc.boolean(),
  hasDevices: fc.boolean(),
  online: fc.boolean(),
  profileComplete: fc.boolean(),
  hasRecentCalls: fc.boolean(),
});

describe('computeHealth — property-based (1000 runs)', () => {
  it('score sempre entre 0 e 100', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        const { score } = computeHealth(input);
        return score >= 0 && score <= 100;
      }),
      { numRuns: 1000, seed: 42 },
    );
  });

  it('máximo absoluto = 100 quando tudo true', () => {
    const { score, issues } = computeHealth({
      hasTrunk: true,
      trunkOnline: true,
      hasDevices: true,
      online: true,
      profileComplete: true,
      hasRecentCalls: true,
    });
    expect(score).toBe(100);
    expect(issues).toEqual([]);
  });

  it('mínimo absoluto = 0 quando tudo false', () => {
    const { score, issues } = computeHealth({
      hasTrunk: false,
      trunkOnline: false,
      hasDevices: false,
      online: false,
      profileComplete: false,
      hasRecentCalls: false,
    });
    expect(score).toBe(0);
    expect(issues.length).toBeGreaterThanOrEqual(5);
  });

  it('trunkOnline NUNCA contribui sem hasTrunk (monotonicidade)', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        const a = computeHealth({ ...input, hasTrunk: false, trunkOnline: false });
        const b = computeHealth({ ...input, hasTrunk: false, trunkOnline: true });
        return a.score === b.score;
      }),
      { numRuns: 500, seed: 7 },
    );
  });

  it('issues vazias se e somente se score === 100', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        const { score, issues } = computeHealth(input);
        return (issues.length === 0) === (score === 100);
      }),
      { numRuns: 1000, seed: 99 },
    );
  });

  it('healthTier respeita faixas: 0-49 bad, 50-79 warn, 80-100 good', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (s) => {
        const t = healthTier(s);
        if (s >= 80) return t === 'good';
        if (s >= 50) return t === 'warn';
        return t === 'bad';
      }),
      { numRuns: 1000, seed: 13 },
    );
  });
});
