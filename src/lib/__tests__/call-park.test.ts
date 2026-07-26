import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  ACTIONS_REQUIRING_TARGET,
  PARK_LIMITS,
  PARK_TIMEOUT_ACTIONS,
  clampInt,
  firstFreeSlot,
  formatCountdown,
  formatTimeout,
  maskPhone,
  normalizeOrbitDraft,
  rangesOverlap,
  secondsRemaining,
  slotCount,
  slotsOf,
  validateOrbitDraft,
  type CallParkOrbit,
  type ParkedCall,
} from '@/lib/call-park';

const RUNS = { numRuns: 400, seed: 20260726 };

const anyValue = fc.oneof(
  fc.string(),
  fc.integer(),
  fc.double(),
  fc.boolean(),
  fc.constant(null),
  fc.constant(undefined),
  fc.object(),
  fc.array(fc.integer()),
);

function orbit(overrides: Partial<CallParkOrbit> = {}): CallParkOrbit {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Padrão',
    description: null,
    slot_start: 701,
    slot_end: 705,
    park_timeout_seconds: 180,
    timeout_action: 'return_parker',
    timeout_target: null,
    moh_prompt_id: null,
    announce_slot: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function parked(slot: number, overrides: Partial<ParkedCall> = {}): ParkedCall {
  return {
    id: `p-${slot}`,
    orbit_id: '11111111-1111-4111-8111-111111111111',
    slot_number: slot,
    call_session_id: null,
    contact_phone: null,
    contact_name: null,
    parked_by: null,
    parked_by_name: null,
    retrieved_by: null,
    retrieved_by_name: null,
    status: 'parked',
    parked_at: '2026-01-01T00:00:00Z',
    expires_at: '2026-01-01T00:03:00Z',
    retrieved_at: null,
    notes: null,
    ...overrides,
  };
}

describe('call-park :: clampInt', () => {
  it('nunca lança e respeita a faixa', () => {
    fc.assert(
      fc.property(anyValue, (value) => {
        const result = clampInt(value, 10, 20, 15);
        expect(Number.isInteger(result)).toBe(true);
        expect(result).toBeGreaterThanOrEqual(10);
        expect(result).toBeLessThanOrEqual(20);
      }),
      RUNS,
    );
  });

  it('tolera símbolos, objetos sem primitivo e NaN', () => {
    expect(clampInt(Symbol('s'), 0, 10, 4)).toBe(4);
    expect(clampInt(Object.create(null), 0, 10, 4)).toBe(4);
    expect(clampInt(NaN, 0, 10, 4)).toBe(4);
    expect(clampInt('  7 ', 0, 10, 4)).toBe(7);
  });
});

describe('call-park :: normalizeOrbitDraft', () => {
  it('nunca viola os CHECK constraints da tabela', () => {
    fc.assert(
      fc.property(
        fc.record(
          {
            name: anyValue,
            description: anyValue,
            slot_start: anyValue,
            slot_end: anyValue,
            park_timeout_seconds: anyValue,
            timeout_action: anyValue,
            timeout_target: anyValue,
            moh_prompt_id: anyValue,
            announce_slot: anyValue,
            is_active: anyValue,
          },
          { requiredKeys: [] },
        ),
        (input) => {
          const draft = normalizeOrbitDraft(input as never);

          expect(draft.slot_start).toBeGreaterThanOrEqual(PARK_LIMITS.minSlot);
          expect(draft.slot_end).toBeGreaterThanOrEqual(draft.slot_start);
          expect(draft.slot_end - draft.slot_start).toBeLessThanOrEqual(
            PARK_LIMITS.maxSlotsPerOrbit - 1,
          );
          expect(draft.park_timeout_seconds).toBeGreaterThanOrEqual(
            PARK_LIMITS.minTimeoutSeconds,
          );
          expect(draft.park_timeout_seconds).toBeLessThanOrEqual(PARK_LIMITS.maxTimeoutSeconds);
          expect(PARK_TIMEOUT_ACTIONS).toContain(draft.timeout_action);
          expect(draft.name.length).toBeLessThanOrEqual(PARK_LIMITS.maxNameLength);

          // o trigger zera o destino quando a ação não é de encaminhamento
          if (!ACTIONS_REQUIRING_TARGET.includes(draft.timeout_action)) {
            expect(draft.timeout_target).toBeNull();
          }
          expect(typeof draft.announce_slot).toBe('boolean');
          expect(typeof draft.is_active).toBe('boolean');
        },
      ),
      RUNS,
    );
  });

  it('é idempotente', () => {
    fc.assert(
      fc.property(
        fc.record({ slot_start: anyValue, slot_end: anyValue }, { requiredKeys: [] }),
        (raw) => {
          const once = normalizeOrbitDraft(raw as never);
          expect(normalizeOrbitDraft(once)).toEqual(once);
        },
      ),
      RUNS,
    );
  });

  it('devolve o padrão para entradas não-objeto', () => {
    for (const value of [null, undefined, 42, 'x', true]) {
      const draft = normalizeOrbitDraft(value);
      expect(draft.slot_start).toBe(701);
      expect(draft.slot_end).toBe(710);
    }
  });

  it('corrige faixa invertida sem lançar', () => {
    const draft = normalizeOrbitDraft({ slot_start: 800, slot_end: 100 });
    expect(draft.slot_end).toBeGreaterThanOrEqual(draft.slot_start);
  });

  it('aceita apenas UUID em moh_prompt_id', () => {
    expect(normalizeOrbitDraft({ moh_prompt_id: 'nao-uuid' }).moh_prompt_id).toBeNull();
    expect(
      normalizeOrbitDraft({ moh_prompt_id: 'AAAAAAAA-1111-4111-8111-111111111111' })
        .moh_prompt_id,
    ).toBe('aaaaaaaa-1111-4111-8111-111111111111');
  });
});

describe('call-park :: validateOrbitDraft', () => {
  it('exige nome', () => {
    expect(validateOrbitDraft(normalizeOrbitDraft({}))).toContain(
      'Informe um nome para a órbita.',
    );
  });

  it('exige destino nas ações de encaminhamento', () => {
    for (const action of ACTIONS_REQUIRING_TARGET) {
      const draft = normalizeOrbitDraft({ name: 'X', timeout_action: action });
      expect(validateOrbitDraft(draft)).toContain(
        'Informe o destino para a ação de tempo esgotado escolhida.',
      );
    }
  });

  it('detecta sobreposição apenas entre órbitas ativas', () => {
    const draft = normalizeOrbitDraft({ name: 'Nova', slot_start: 705, slot_end: 715 });
    const conflict = orbit({ name: 'Antiga', slot_start: 701, slot_end: 710 });
    expect(validateOrbitDraft(draft, [conflict]).length).toBe(1);
    expect(validateOrbitDraft({ ...draft, is_active: false }, [conflict])).toHaveLength(0);
    expect(
      validateOrbitDraft(draft, [orbit({ slot_start: 800, slot_end: 810 })]),
    ).toHaveLength(0);
  });

  it('rascunhos normalizados válidos passam sempre que há nome e destino', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5000 }),
        fc.integer({ min: 0, max: 99 }),
        (start, span) => {
          const draft = normalizeOrbitDraft({
            name: 'Órbita',
            slot_start: start,
            slot_end: start + span,
            timeout_action: 'return_parker',
          });
          expect(validateOrbitDraft(draft, [])).toHaveLength(0);
        },
      ),
      RUNS,
    );
  });
});

describe('call-park :: vagas', () => {
  it('slotCount e slotsOf são coerentes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 900 }),
        fc.integer({ min: 0, max: 99 }),
        (start, span) => {
          const range = { slot_start: start, slot_end: start + span };
          expect(slotsOf(range)).toHaveLength(slotCount(range));
          expect(slotCount(range)).toBe(span + 1);
        },
      ),
      RUNS,
    );
  });

  it('rangesOverlap é simétrico', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 0, max: 20 }),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 0, max: 20 }),
        (a1, aSpan, b1, bSpan) => {
          const a = { slot_start: a1, slot_end: a1 + aSpan };
          const b = { slot_start: b1, slot_end: b1 + bSpan };
          expect(rangesOverlap(a, b)).toBe(rangesOverlap(b, a));
        },
      ),
      RUNS,
    );
  });

  it('firstFreeSlot ignora chamadas de outra órbita e já retiradas', () => {
    const o = orbit();
    expect(firstFreeSlot(o, [])).toBe(701);
    expect(firstFreeSlot(o, [parked(701), parked(702)])).toBe(703);
    expect(firstFreeSlot(o, [parked(701, { status: 'retrieved' })])).toBe(701);
    expect(firstFreeSlot(o, [parked(701, { orbit_id: 'outra' })])).toBe(701);
    expect(firstFreeSlot(o, [701, 702, 703, 704, 705].map((s) => parked(s)))).toBeNull();
  });
});

describe('call-park :: tempo e formatação', () => {
  it('secondsRemaining nunca é negativo nem NaN', () => {
    fc.assert(
      fc.property(anyValue, (value) => {
        const result = secondsRemaining(value);
        expect(Number.isFinite(result)).toBe(true);
        expect(result).toBeGreaterThanOrEqual(0);
      }),
      RUNS,
    );
  });

  it('calcula corretamente contra um agora fixo', () => {
    const now = Date.parse('2026-01-01T00:00:00Z');
    expect(secondsRemaining('2026-01-01T00:02:00Z', now)).toBe(120);
    expect(secondsRemaining('2025-12-31T23:59:00Z', now)).toBe(0);
    expect(secondsRemaining('data-invalida', now)).toBe(0);
  });

  it('formatCountdown e formatTimeout nunca produzem NaN', () => {
    fc.assert(
      fc.property(anyValue, (value) => {
        expect(formatCountdown(value)).toMatch(/^\d{2,}:\d{2}$/);
        expect(formatTimeout(value)).not.toContain('NaN');
      }),
      RUNS,
    );
  });

  it('formata valores conhecidos', () => {
    expect(formatCountdown(0)).toBe('00:00');
    expect(formatCountdown(185)).toBe('03:05');
    expect(formatTimeout(180)).toBe('3 min');
    expect(formatTimeout(45)).toBe('45 s');
  });

  it('maskPhone jamais expõe mais que os 4 últimos dígitos', () => {
    fc.assert(
      fc.property(anyValue, (value) => {
        const masked = maskPhone(value);
        const digits = masked.replace(/\D/g, '');
        expect(digits.length).toBeLessThanOrEqual(4);
      }),
      RUNS,
    );
  });

  it('mascara telefones reais', () => {
    expect(maskPhone('+55 11 98888-1234')).toBe('••••1234');
    expect(maskPhone('12')).toBe('••12');
    expect(maskPhone(null)).toBe('—');
  });
});
