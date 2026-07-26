import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  DEFAULT_QUEUE_DRAFT,
  OVERFLOW_ACTIONS,
  QUEUE_LIMITS,
  QUEUE_STRATEGIES,
  clampInt,
  formatSeconds,
  normalizeQueueDraft,
  ringCyclesWithinWait,
  validateQueueDraft,
} from '../call-queue';

const RUNS = { numRuns: 400 } as const;

describe('call-queue :: clampInt', () => {
  it('sempre devolve inteiro dentro da faixa', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        const value = clampInt(raw, 5, 300, 20);
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(5);
        expect(value).toBeLessThanOrEqual(300);
      }),
      RUNS,
    );
  });

  it('usa o fallback para valores não finitos', () => {
    expect(clampInt(Number.NaN, 0, 10, 7)).toBe(7);
    expect(clampInt(Number.POSITIVE_INFINITY, 0, 10, 7)).toBe(7);
    expect(clampInt('abc', 0, 10, 7)).toBe(7);
  });
});

describe('call-queue :: normalizeQueueDraft', () => {
  it('nunca produz payload que viole os CHECK constraints', () => {
    fc.assert(
      fc.property(
        fc.record(
          {
            name: fc.oneof(fc.string(), fc.constant(undefined)),
            description: fc.oneof(fc.string(), fc.constant(null)),
            strategy: fc.oneof(fc.string(), fc.constantFrom(...QUEUE_STRATEGIES)),
            overflow_action: fc.oneof(fc.string(), fc.constantFrom(...OVERFLOW_ACTIONS)),
            overflow_queue_id: fc.oneof(fc.string(), fc.constant(null)),
            ring_timeout_seconds: fc.oneof(fc.integer(), fc.double(), fc.constant(undefined)),
            wrap_up_seconds: fc.oneof(fc.integer(), fc.constant(undefined)),
            max_wait_seconds: fc.oneof(fc.integer(), fc.constant(undefined)),
            max_queue_size: fc.oneof(fc.integer(), fc.constant(undefined)),
            priority: fc.oneof(fc.integer(), fc.constant(undefined)),
            announce_interval_seconds: fc.oneof(fc.integer(), fc.constant(undefined)),
            moh_url: fc.oneof(fc.string(), fc.constant(null)),
            moh_enabled: fc.oneof(fc.boolean(), fc.constant(undefined)),
            is_active: fc.oneof(fc.boolean(), fc.constant(undefined)),
            announce_position: fc.oneof(fc.boolean(), fc.constant(undefined)),
            announce_hold_time: fc.oneof(fc.boolean(), fc.constant(undefined)),
          },
          { requiredKeys: [] },
        ),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (raw: any) => {
          const draft = normalizeQueueDraft(raw);

          expect(QUEUE_STRATEGIES).toContain(draft.strategy);
          expect(OVERFLOW_ACTIONS).toContain(draft.overflow_action);

          const ranges: Array<[number, { min: number; max: number }]> = [
            [draft.ring_timeout_seconds, QUEUE_LIMITS.ringTimeout],
            [draft.wrap_up_seconds, QUEUE_LIMITS.wrapUp],
            [draft.max_wait_seconds, QUEUE_LIMITS.maxWait],
            [draft.max_queue_size, QUEUE_LIMITS.maxSize],
            [draft.priority, QUEUE_LIMITS.priority],
            [draft.announce_interval_seconds, QUEUE_LIMITS.announceInterval],
          ];
          for (const [value, range] of ranges) {
            expect(Number.isInteger(value)).toBe(true);
            expect(value).toBeGreaterThanOrEqual(range.min);
            expect(value).toBeLessThanOrEqual(range.max);
          }

          expect(draft.name.length).toBeLessThanOrEqual(120);
          expect(draft.name).toBe(draft.name.trim());
          expect((draft.moh_url ?? '').length).toBeLessThanOrEqual(2048);
          expect((draft.description ?? '').length).toBeLessThanOrEqual(500);

          // overflow_queue_id só sobrevive quando a ação é transbordo para fila
          if (draft.overflow_action !== 'transfer_queue') {
            expect(draft.overflow_queue_id).toBeNull();
          }
        },
      ),
      RUNS,
    );
  });

  it('é idempotente', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string(),
          priority: fc.integer(),
          max_wait_seconds: fc.integer(),
        }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (raw: any) => {
          const once = normalizeQueueDraft(raw);
          expect(normalizeQueueDraft(once)).toEqual(once);
        },
      ),
      RUNS,
    );
  });
});

describe('call-queue :: validateQueueDraft', () => {
  it('exige nome', () => {
    expect(validateQueueDraft(normalizeQueueDraft({ name: '   ' }))).toContain(
      'Informe um nome para a fila.',
    );
  });

  it('exige destino em transbordo para fila e recusa auto-referência', () => {
    const draft = normalizeQueueDraft({
      name: 'Suporte',
      overflow_action: 'transfer_queue',
    });
    expect(validateQueueDraft(draft).length).toBeGreaterThan(0);

    const selfRef = normalizeQueueDraft({
      name: 'Suporte',
      overflow_action: 'transfer_queue',
      overflow_queue_id: 'abc',
    });
    expect(validateQueueDraft(selfRef, { selfId: 'abc' })).toContain(
      'A fila de transbordo não pode ser ela mesma.',
    );
  });

  it('recusa URL de MoH fora de http(s)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((value) => !/^https?:\/\//i.test(value.trim())),
        (url) => {
          const draft = normalizeQueueDraft({ name: 'Fila', moh_url: url });
          if (draft.moh_url === null) return; // string em branco vira null
          expect(validateQueueDraft(draft)).toContain(
            'O áudio de espera deve ser uma URL http(s) válida.',
          );
        },
      ),
      RUNS,
    );
  });

  it('aceita configuração padrão com nome válido', () => {
    expect(validateQueueDraft(normalizeQueueDraft({ ...DEFAULT_QUEUE_DRAFT, name: 'Vendas' })))
      .toEqual([]);
  });
});

describe('call-queue :: formatSeconds e ciclos', () => {
  it('nunca retorna string vazia nem NaN', () => {
    fc.assert(
      fc.property(fc.double({ noDefaultInfinity: true, noNaN: false }), (value) => {
        const label = formatSeconds(value);
        expect(label.length).toBeGreaterThan(0);
        expect(label).not.toContain('NaN');
      }),
      RUNS,
    );
  });

  it('formata limites conhecidos', () => {
    expect(formatSeconds(0)).toBe('0 s');
    expect(formatSeconds(59)).toBe('59 s');
    expect(formatSeconds(60)).toBe('1 min');
    expect(formatSeconds(150)).toBe('2 min 30 s');
  });

  it('ciclos de toque são não-negativos e coerentes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 300 }),
        fc.integer({ min: 0, max: 600 }),
        fc.integer({ min: 10, max: 7200 }),
        (ring, wrap, wait) => {
          const draft = normalizeQueueDraft({
            name: 'Fila',
            ring_timeout_seconds: ring,
            wrap_up_seconds: wrap,
            max_wait_seconds: wait,
          });
          const cycles = ringCyclesWithinWait(draft);
          expect(cycles).toBeGreaterThanOrEqual(0);
          expect(cycles * (ring + wrap)).toBeLessThanOrEqual(wait);
        },
      ),
      RUNS,
    );
  });
});
