/**
 * Simulação exaustiva (PBT) das etiquetas de favoritos e dos toques
 * configuráveis. Seeds fixos garantem reprodutibilidade no CI.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';

import {
  MAX_TAG_LENGTH,
  TAG_PRESETS,
  UNTAGGED_LABEL,
  collectTagOptions,
  groupFavoritesByTag,
  isSameTag,
  normalizeTag,
} from '@/lib/dialer-favorite-tags';
import {
  DEFAULT_RINGTONE_ID,
  DEFAULT_VOLUME,
  RINGTONE_PRESETS,
  RINGTONE_STORAGE_KEY,
  RINGTONE_VOLUME_STORAGE_KEY,
  clampVolume,
  getRingtonePreset,
  loadRingtoneSettings,
  saveRingtoneSettings,
} from '@/lib/ringtone-presets';

const RUNS = { numRuns: 300, seed: 20260726 };

describe('normalizeTag', () => {
  it('sempre devolve null ou string válida para o CHECK do banco', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 80 }), (raw) => {
        const tag = normalizeTag(raw);
        if (tag === null) return true;
        return (
          tag === tag.trim() &&
          tag.length >= 1 &&
          tag.length <= MAX_TAG_LENGTH &&
          !/\s{2,}/.test(tag)
        );
      }),
      RUNS,
    );
  });

  it('é idempotente', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 60 }), (raw) => {
        const once = normalizeTag(raw);
        return normalizeTag(once) === once;
      }),
      RUNS,
    );
  });

  it('rejeita entradas não textuais e vazias', () => {
    for (const value of [null, undefined, 0, 42, {}, [], NaN, true, '   ', '\n\t']) {
      expect(normalizeTag(value)).toBeNull();
    }
  });

  it('colapsa espaçamentos internos e corta em 24 caracteres', () => {
    expect(normalizeTag('  VIP   Premium  ')).toBe('VIP Premium');
    expect(normalizeTag('A'.repeat(50))).toHaveLength(MAX_TAG_LENGTH);
    expect(normalizeTag(`${'B'.repeat(24)} extra`)).toBe('B'.repeat(24));
  });
});

describe('isSameTag', () => {
  it('ignora caixa e acentuação de base', () => {
    expect(isSameTag('VIP', 'vip')).toBe(true);
    expect(isSameTag('Clientes', ' clientes ')).toBe(true);
    expect(isSameTag('VIP', 'Suporte')).toBe(false);
    expect(isSameTag(null, '   ')).toBe(true);
    expect(isSameTag('VIP', null)).toBe(false);
  });
});

describe('groupFavoritesByTag', () => {
  const favoriteArb = fc.record({
    id: fc.uuid(),
    tag: fc.oneof(
      fc.constant(null),
      fc.constant(undefined),
      fc.constantFrom(...TAG_PRESETS),
      fc.string({ maxLength: 30 }),
    ),
  });

  it('preserva todos os itens exatamente uma vez', () => {
    fc.assert(
      fc.property(fc.array(favoriteArb, { maxLength: 40 }), (items) => {
        const flat = groupFavoritesByTag(items).flatMap((group) => group.items);
        return flat.length === items.length && new Set(flat).size === new Set(items).size;
      }),
      RUNS,
    );
  });

  it('mantém a ordem original dentro de cada grupo', () => {
    fc.assert(
      fc.property(fc.array(favoriteArb, { maxLength: 40 }), (items) => {
        return groupFavoritesByTag(items).every((group) => {
          const indices = group.items.map((item) => items.indexOf(item));
          return indices.every((value, i) => i === 0 || indices[i - 1] < value);
        });
      }),
      RUNS,
    );
  });

  it('coloca o grupo sem etiqueta sempre por último', () => {
    fc.assert(
      fc.property(fc.array(favoriteArb, { maxLength: 30 }), (items) => {
        const groups = groupFavoritesByTag(items);
        const untaggedIndex = groups.findIndex((group) => group.tag === null);
        return untaggedIndex === -1 || untaggedIndex === groups.length - 1;
      }),
      RUNS,
    );
  });

  it('não fragmenta grupos por diferença de caixa', () => {
    const groups = groupFavoritesByTag([
      { tag: 'VIP' },
      { tag: 'vip' },
      { tag: ' Vip ' },
      { tag: null },
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0].items).toHaveLength(3);
    expect(groups[1].label).toBe(UNTAGGED_LABEL);
  });

  it('tolera entradas corrompidas', () => {
    const dirty = [null, undefined, 'texto', 7, { tag: 'VIP' }] as unknown as Array<{ tag?: string | null }>;
    expect(() => groupFavoritesByTag(dirty)).not.toThrow();
    expect(groupFavoritesByTag(undefined as never)).toEqual([]);
  });
});

describe('collectTagOptions', () => {
  it('inclui todos os presets e não repete etiquetas equivalentes', () => {
    const options = collectTagOptions([{ tag: 'vip' }, { tag: 'Parceiros' }, { tag: '   ' }]);
    expect(options).toContain('Parceiros');
    expect(options.filter((option) => option.toLowerCase() === 'vip')).toHaveLength(1);
    expect(options.length).toBeGreaterThanOrEqual(TAG_PRESETS.length);
  });
});

describe('ringtone presets', () => {
  it('presets têm ciclo maior que a duração total dos tons', () => {
    for (const preset of RINGTONE_PRESETS) {
      const total = preset.tones.reduce((max, t) => Math.max(max, t.offsetMs + t.durationMs), 0);
      expect(preset.cycleMs).toBeGreaterThanOrEqual(total);
      expect(preset.id.length).toBeGreaterThan(0);
    }
  });

  it('getRingtonePreset nunca falha e cai no padrão', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        const preset = getRingtonePreset(value);
        return RINGTONE_PRESETS.some((candidate) => candidate.id === preset.id);
      }),
      RUNS,
    );
    expect(getRingtonePreset('inexistente').id).toBe(DEFAULT_RINGTONE_ID);
  });

  it('clampVolume mantém o intervalo 0..1 para qualquer entrada', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        const volume = clampVolume(value);
        return Number.isFinite(volume) && volume >= 0 && volume <= 1;
      }),
      RUNS,
    );
    expect(clampVolume(Number.NaN)).toBe(DEFAULT_VOLUME);
    expect(clampVolume(Infinity)).toBe(DEFAULT_VOLUME);
    expect(clampVolume('0.5')).toBe(0.5);
    expect(clampVolume(-3)).toBe(0);
    expect(clampVolume(9)).toBe(1);
  });
});

describe('persistência das preferências de toque', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('faz round-trip de preset e volume', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...RINGTONE_PRESETS.map((preset) => preset.id)),
        fc.double({ min: 0, max: 1, noNaN: true }),
        (presetId, volume) => {
          saveRingtoneSettings({ presetId, volume });
          const loaded = loadRingtoneSettings();
          return loaded.presetId === presetId && Math.abs(loaded.volume - volume) < 1e-9;
        },
      ),
      { numRuns: 200, seed: 20260726 },
    );
  });

  it('sanea valores corrompidos no storage', () => {
    window.localStorage.setItem(RINGTONE_STORAGE_KEY, 'hacker');
    window.localStorage.setItem(RINGTONE_VOLUME_STORAGE_KEY, 'NaN');
    const loaded = loadRingtoneSettings();
    expect(loaded.presetId).toBe(DEFAULT_RINGTONE_ID);
    expect(loaded.volume).toBe(DEFAULT_VOLUME);
  });

  it('não lança quando o storage está indisponível', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    expect(() => saveRingtoneSettings({ presetId: 'soft', volume: 0.5 })).not.toThrow();
    expect(loadRingtoneSettings()).toEqual({
      presetId: DEFAULT_RINGTONE_ID,
      volume: DEFAULT_VOLUME,
    });
  });
});
