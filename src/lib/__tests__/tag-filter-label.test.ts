import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  ALL_TAGS_FILTER,
  UNTAGGED_FILTER,
  UNTAGGED_LABEL,
  formatTagFilterLabel,
} from '@/lib/dialer-favorite-tags';

describe('formatTagFilterLabel', () => {
  it('mapeia sentinelas para rótulos legíveis', () => {
    expect(formatTagFilterLabel(ALL_TAGS_FILTER)).toBe('Todos');
    expect(formatTagFilterLabel(UNTAGGED_FILTER)).toBe(UNTAGGED_LABEL);
    expect(formatTagFilterLabel(null)).toBe('Todos');
    expect(formatTagFilterLabel(undefined)).toBe('Todos');
  });

  it('nunca lança e sempre devolve string não vazia (PBT)', () => {
    fc.assert(
      fc.property(fc.string(), (raw) => {
        const label = formatTagFilterLabel(raw);
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
        expect(label.length).toBeLessThanOrEqual(24);
      }),
      { numRuns: 600, seed: 42 },
    );
  });
});
