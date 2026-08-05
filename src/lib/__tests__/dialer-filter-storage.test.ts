import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { ALL_TAGS_FILTER, UNTAGGED_FILTER, normalizeTag } from '@/lib/dialer-favorite-tags';
import {
  buildFilterStorageKey,
  loadTagFilter,
  sanitizeStoredFilter,
  saveTagFilter,
  type FilterStorageLike,
} from '@/lib/dialer-filter-storage';

/** Storage em memória — determinístico e isolado por teste. */
function createMemoryStorage(): FilterStorageLike & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

/** Storage que sempre falha (quota estourada / modo privado). */
const hostileStorage: FilterStorageLike = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
  removeItem: () => {
    throw new Error('QuotaExceededError');
  },
};

const RUNS = 500;

describe('dialer-filter-storage', () => {
  it('sanitiza qualquer entrada para um filtro válido', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        const result = sanitizeStoredFilter(raw);
        expect(typeof result).toBe('string');
        const isSentinel = result === ALL_TAGS_FILTER || result === UNTAGGED_FILTER;
        expect(isSentinel || normalizeTag(result) === result).toBe(true);
      }),
      { numRuns: RUNS, seed: 20260726 },
    );
  });

  it('round-trip: o que é salvo é o que é lido', () => {
    fc.assert(
      fc.property(fc.option(fc.string(), { nil: undefined }), fc.string(), (userId, filter) => {
        const storage = createMemoryStorage();
        const saved = saveTagFilter(userId, filter, storage);
        expect(loadTagFilter(userId, storage)).toBe(saved);
      }),
      { numRuns: RUNS, seed: 20260726 },
    );
  });

  it('"Todos" nunca deixa lixo no storage', () => {
    fc.assert(
      fc.property(fc.string(), (userId) => {
        const storage = createMemoryStorage();
        saveTagFilter(userId, 'VIP', storage);
        saveTagFilter(userId, ALL_TAGS_FILTER, storage);
        expect(storage.map.size).toBe(0);
        expect(loadTagFilter(userId, storage)).toBe(ALL_TAGS_FILTER);
      }),
      { numRuns: RUNS, seed: 20260726 },
    );
  });

  it('escopos distintos nunca compartilham valor', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (a, b) => {
          fc.pre(a.trim() !== b.trim());
          const storage = createMemoryStorage();
          saveTagFilter(a, 'VIP', storage);
          expect(buildFilterStorageKey(a)).not.toBe(buildFilterStorageKey(b));
          expect(loadTagFilter(b, storage)).toBe(ALL_TAGS_FILTER);
        },
      ),
      { numRuns: RUNS, seed: 20260726 },
    );
  });

  it('storage hostil degrada para "Todos" sem lançar', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        expect(() => saveTagFilter('u1', raw, hostileStorage)).not.toThrow();
        expect(loadTagFilter('u1', hostileStorage)).toBe(ALL_TAGS_FILTER);
      }),
      { numRuns: RUNS, seed: 20260726 },
    );
  });

  it('preserva os sentinelas conhecidos', () => {
    const storage = createMemoryStorage();
    expect(saveTagFilter('u', UNTAGGED_FILTER, storage)).toBe(UNTAGGED_FILTER);
    expect(loadTagFilter('u', storage)).toBe(UNTAGGED_FILTER);
  });
});
