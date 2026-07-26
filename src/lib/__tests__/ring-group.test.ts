import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  DEFAULT_RING_GROUP_DRAFT,
  NO_ANSWER_ACTIONS,
  RING_GROUP_LIMITS,
  RING_STRATEGIES,
  clampInt,
  estimateRingDurationSeconds,
  formatRingSeconds,
  normalizeRingGroupDraft,
  reindexMembers,
  sanitizeExtension,
  validateRingGroupDraft,
  type RingGroupDraft,
} from '@/lib/ring-group';

const RUNS = { numRuns: 400 } as const;

describe('sanitizeExtension', () => {
  it('sempre produz null ou uma string aceita pelo CHECK do banco', () => {
    fc.assert(
      fc.property(fc.anything(), (input) => {
        const result = sanitizeExtension(input);
        if (result === null) return true;
        return /^[0-9*#+]{1,20}$/.test(result);
      }),
      RUNS,
    );
  });

  it('descarta caracteres inválidos preservando os válidos', () => {
    expect(sanitizeExtension(' 40-00 abc*# ')).toBe('4000*#');
    expect(sanitizeExtension('abc')).toBeNull();
    expect(sanitizeExtension('1'.repeat(50))).toHaveLength(20);
  });
});

describe('clampInt', () => {
  it('nunca sai da faixa e nunca retorna NaN', () => {
    fc.assert(
      fc.property(fc.anything(), (input) => {
        const value = clampInt(input, 5, 300, 25);
        return Number.isInteger(value) && value >= 5 && value <= 300;
      }),
      RUNS,
    );
  });
});

describe('normalizeRingGroupDraft', () => {
  it('produz payload sempre válido para o banco a partir de entrada arbitrária', () => {
    fc.assert(
      fc.property(fc.anything(), (input) => {
        const draft = normalizeRingGroupDraft(input as Partial<RingGroupDraft>);

        expect(RING_STRATEGIES).toContain(draft.strategy);
        expect(NO_ANSWER_ACTIONS).toContain(draft.no_answer_action);
        expect(draft.name.length).toBeLessThanOrEqual(120);
        expect(draft.description === null || draft.description.length <= 500).toBe(true);
        expect(
          draft.ring_timeout_seconds >= RING_GROUP_LIMITS.ringTimeout.min &&
            draft.ring_timeout_seconds <= RING_GROUP_LIMITS.ringTimeout.max,
        ).toBe(true);
        expect(
          draft.step_timeout_seconds >= RING_GROUP_LIMITS.stepTimeout.min &&
            draft.step_timeout_seconds <= RING_GROUP_LIMITS.stepTimeout.max,
        ).toBe(true);
        expect(typeof draft.is_active).toBe('boolean');
        expect(typeof draft.skip_busy_agents).toBe('boolean');
        return true;
      }),
      RUNS,
    );
  });

  it('zera o destino quando a ação não é de encaminhamento (igual ao trigger)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...NO_ANSWER_ACTIONS),
        fc.string(),
        (action, target) => {
          const draft = normalizeRingGroupDraft({
            name: 'grupo',
            no_answer_action: action,
            forward_target: target,
          });
          if (action === 'voicemail' || action === 'hangup') {
            return draft.forward_target === null;
          }
          return true;
        },
      ),
      RUNS,
    );
  });

  it('é idempotente', () => {
    fc.assert(
      fc.property(fc.anything(), (input) => {
        const once = normalizeRingGroupDraft(input as Partial<RingGroupDraft>);
        const twice = normalizeRingGroupDraft(once);
        expect(twice).toEqual(once);
        return true;
      }),
      RUNS,
    );
  });
});

describe('validateRingGroupDraft', () => {
  it('exige nome', () => {
    expect(validateRingGroupDraft(normalizeRingGroupDraft({ name: '   ' }))).toContain(
      'Informe um nome para o grupo.',
    );
  });

  it('exige destino em encaminhamentos', () => {
    const draft = normalizeRingGroupDraft({
      name: 'Suporte',
      no_answer_action: 'forward_queue',
      forward_target: '   ',
    });
    expect(validateRingGroupDraft(draft)).toContain('Informe o destino do encaminhamento.');
  });

  it('bloqueia auto-referência de ramal', () => {
    const draft = normalizeRingGroupDraft({
      name: 'Suporte',
      extension: '4000',
      no_answer_action: 'forward_extension',
      forward_target: '4000',
    });
    expect(validateRingGroupDraft(draft)).toContain(
      'O grupo não pode encaminhar para o próprio ramal.',
    );
  });

  it('bloqueia ramal duplicado', () => {
    const draft = normalizeRingGroupDraft({ name: 'Suporte', extension: '4000' });
    expect(validateRingGroupDraft(draft, { existingExtensions: ['4000'] })).toContain(
      'Este ramal virtual já está em uso por outro grupo.',
    );
  });

  it('aceita rascunho mínimo válido', () => {
    expect(validateRingGroupDraft(normalizeRingGroupDraft({ name: 'Suporte' }))).toEqual([]);
  });
});

describe('estimateRingDurationSeconds', () => {
  it('nunca é negativo nem NaN', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...RING_STRATEGIES),
        fc.array(
          fc.record({
            delay_seconds: fc.integer({ min: -1000, max: 1000 }),
            is_enabled: fc.boolean(),
          }),
          { maxLength: 12 },
        ),
        (strategy, members) => {
          const value = estimateRingDurationSeconds(
            { ...DEFAULT_RING_GROUP_DRAFT, strategy },
            members,
          );
          return Number.isFinite(value) && value >= 0;
        },
      ),
      RUNS,
    );
  });

  it('retorna zero sem participantes habilitados', () => {
    expect(
      estimateRingDurationSeconds(DEFAULT_RING_GROUP_DRAFT, [
        { delay_seconds: 10, is_enabled: false },
      ]),
    ).toBe(0);
  });
});

describe('formatRingSeconds', () => {
  it('nunca emite NaN nem valores negativos', () => {
    fc.assert(
      fc.property(fc.double({ noDefaultInfinity: false, noNaN: false }), (value) => {
        const label = formatRingSeconds(value);
        return !label.includes('NaN') && !label.includes('-');
      }),
      RUNS,
    );
  });
});

describe('reindexMembers', () => {
  it('produz ordem contígua a partir de zero preservando a quantidade', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ ring_order: fc.integer({ min: -50, max: 999 }) }), {
          maxLength: 20,
        }),
        (members) => {
          const result = reindexMembers(members);
          expect(result).toHaveLength(members.length);
          return result.every((member, index) => member.ring_order === index);
        },
      ),
      RUNS,
    );
  });
});
