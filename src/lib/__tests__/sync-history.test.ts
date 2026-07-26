import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  MAX_SYNC_HISTORY_ENTRIES,
  appendEntry,
  buildSyncHistoryKey,
  clearSyncHistory,
  formatSyncEntry,
  loadSyncHistory,
  recordSyncEvent,
  sanitizeEntry,
  type SyncHistoryStorageLike,
} from '@/lib/sync-history';

function memoryStorage(): SyncHistoryStorageLike & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

const hostile: SyncHistoryStorageLike = {
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

const RUNS = 400;
const SEED = 20260726;

describe('sync-history', () => {
  it('sanitizeEntry só aceita timestamps finitos e positivos', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        const result = sanitizeEntry(raw);
        return result === null || (Number.isFinite(result.at) && result.at > 0);
      }),
      { numRuns: RUNS, seed: SEED },
    );
  });

  it('nunca ultrapassa o limite de entradas', () => {
    fc.assert(
      fc.property(fc.array(fc.string(), { maxLength: 40 }), (subjects) => {
        const storage = memoryStorage();
        subjects.forEach((s) => recordSyncEvent('u1', { subject: s, detail: 'x' }, storage));
        return loadSyncHistory('u1', storage).length <= MAX_SYNC_HISTORY_ENTRIES;
      }),
      { numRuns: 200, seed: SEED },
    );
  });

  it('appendEntry mantém a entrada mais recente no topo', () => {
    const entry = { subject: 'Toque', detail: 'Clássico', device: null, at: 10 };
    const next = appendEntry([{ ...entry, at: 5 }], entry);
    expect(next[0].at).toBe(10);
  });

  it('escopos de usuário nunca colidem', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (a, b) => {
          fc.pre(a.trim() !== b.trim());
          const storage = memoryStorage();
          recordSyncEvent(a, { subject: 'Toque', detail: 'VIP' }, storage);
          expect(buildSyncHistoryKey(a)).not.toBe(buildSyncHistoryKey(b));
          expect(loadSyncHistory(b, storage)).toEqual([]);
        },
      ),
      { numRuns: 200, seed: SEED },
    );
  });

  it('storage corrompido ou hostil degrada para lista vazia sem lançar', () => {
    fc.assert(
      fc.property(fc.string(), (raw) => {
        const storage = memoryStorage();
        storage.map.set(buildSyncHistoryKey('u1'), raw);
        expect(() => loadSyncHistory('u1', storage)).not.toThrow();
        expect(Array.isArray(loadSyncHistory('u1', storage))).toBe(true);
        expect(() => recordSyncEvent('u1', { subject: 'a', detail: 'b' }, hostile)).not.toThrow();
        expect(loadSyncHistory('u1', hostile)).toEqual([]);
      }),
      { numRuns: RUNS, seed: SEED },
    );
  });

  it('formatSyncEntry sempre produz texto legível', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        fc.option(fc.string(), { nil: null }),
        fc.integer({ min: 1, max: 2 ** 42 }),
        (subject, detail, device, at) => {
          const entry = sanitizeEntry({ subject, detail, device, at });
          if (!entry) return true;
          const text = formatSyncEntry(entry);
          return text.includes(' → ') && text.length > 3;
        },
      ),
      { numRuns: RUNS, seed: SEED },
    );
  });

  it('clear remove tudo do escopo', () => {
    const storage = memoryStorage();
    recordSyncEvent('u1', { subject: 'Toque', detail: 'VIP' }, storage);
    expect(clearSyncHistory('u1', storage)).toEqual([]);
    expect(loadSyncHistory('u1', storage)).toEqual([]);
  });
});
