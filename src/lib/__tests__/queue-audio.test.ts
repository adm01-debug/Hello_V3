import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  ALLOWED_AUDIO_MIME_TYPES,
  AUDIO_LIMITS,
  AUDIO_PROMPT_KINDS,
  buildStoragePath,
  clampNumber,
  formatBytes,
  formatDuration,
  normalizeAudioPromptDraft,
  promptsForSlot,
  QUEUE_AUDIO_SLOTS,
  resolveSlotSelection,
  sanitizeFileName,
  validateAudioFile,
  validateAudioPromptDraft,
  type AudioPromptKind,
  type QueueAudioPrompt,
  type QueueAudioSlot,
} from '@/lib/queue-audio';

const RUNS = { numRuns: 400, seed: 20260726 };

const anyValue = fc.oneof(
  fc.string(),
  fc.integer(),
  fc.double(),
  fc.boolean(),
  fc.constant(null),
  fc.constant(undefined),
  fc.object(),
  fc.array(fc.string()),
);

function makePrompt(overrides: Partial<QueueAudioPrompt>): QueueAudioPrompt {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Faixa',
    description: null,
    kind: 'moh',
    storage_path: 'moh/a.mp3',
    mime_type: 'audio/mpeg',
    file_size_bytes: 1024,
    duration_seconds: 30,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('queue-audio :: clampNumber', () => {
  it('nunca lança e respeita a faixa para qualquer entrada', () => {
    fc.assert(
      fc.property(anyValue, (value) => {
        const result = clampNumber(value, 0, 100, 7);
        expect(Number.isInteger(result)).toBe(true);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(100);
      }),
      RUNS,
    );
  });

  it('tolera símbolos e objetos sem conversão primitiva', () => {
    expect(clampNumber(Symbol('x'), 0, 10, 3)).toBe(3);
    expect(clampNumber(Object.create(null), 0, 10, 3)).toBe(3);
    expect(clampNumber(NaN, 0, 10, 3)).toBe(3);
  });
});

describe('queue-audio :: sanitizeFileName', () => {
  it('nunca produz separadores, travessia ou string vazia', () => {
    fc.assert(
      fc.property(anyValue, (value) => {
        const result = sanitizeFileName(value);
        expect(result.length).toBeGreaterThan(0);
        expect(result).not.toContain('/');
        expect(result).not.toContain('\\');
        expect(result).not.toContain('..');
        expect(result.length).toBeLessThanOrEqual(80);
      }),
      RUNS,
    );
  });

  it('remove acentos e caminhos maliciosos', () => {
    expect(sanitizeFileName('../../etc/passwd')).toBe('passwd');
    expect(sanitizeFileName('Espera Relaxante ção.mp3')).toBe('Espera-Relaxante-cao.mp3');
    expect(sanitizeFileName('   ')).toBe('audio');
  });
});

describe('queue-audio :: buildStoragePath', () => {
  it('sempre gera caminho com prefixo de tipo válido e dentro do limite', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...AUDIO_PROMPT_KINDS),
        anyValue,
        fc.string(),
        (kind, fileName, id) => {
          const path = buildStoragePath(kind as AudioPromptKind, fileName, id);
          expect(path.startsWith(`${kind}/`)).toBe(true);
          expect(path.length).toBeLessThanOrEqual(AUDIO_LIMITS.maxPathLength);
          expect(path).not.toContain('..');
        },
      ),
      RUNS,
    );
  });

  it('cai em "moh" para tipos desconhecidos', () => {
    expect(buildStoragePath('invalido' as AudioPromptKind, 'a.mp3', 'x').startsWith('moh/')).toBe(
      true,
    );
  });
});

describe('queue-audio :: validateAudioFile', () => {
  it('nunca lança e aprova apenas mime permitido dentro do limite', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string(),
          size: fc.integer({ min: -10, max: AUDIO_LIMITS.maxFileBytes * 2 }),
          type: fc.oneof(fc.constantFrom(...ALLOWED_AUDIO_MIME_TYPES), fc.string()),
        }),
        (file) => {
          const errors = validateAudioFile(file);
          const shouldPass =
            file.size > 0 &&
            file.size <= AUDIO_LIMITS.maxFileBytes &&
            (ALLOWED_AUDIO_MIME_TYPES as readonly string[]).includes(file.type.toLowerCase());
          expect(errors.length === 0).toBe(shouldPass);
        },
      ),
      RUNS,
    );
  });

  it('rejeita ausência de arquivo', () => {
    expect(validateAudioFile(null).length).toBe(1);
    expect(validateAudioFile(undefined).length).toBe(1);
  });
});

describe('queue-audio :: normalizeAudioPromptDraft', () => {
  it('produz payload que satisfaz todos os CHECK constraints', () => {
    fc.assert(
      fc.property(
        fc.record(
          {
            name: anyValue,
            description: anyValue,
            kind: anyValue,
            storage_path: anyValue,
            mime_type: anyValue,
            file_size_bytes: anyValue,
            duration_seconds: anyValue,
            is_active: anyValue,
          },
          { requiredKeys: [] },
        ),
        (input) => {
          const draft = normalizeAudioPromptDraft(input as never);
          expect(AUDIO_PROMPT_KINDS).toContain(draft.kind);
          expect(draft.name.length).toBeLessThanOrEqual(AUDIO_LIMITS.maxNameLength);
          expect(draft.mime_type.startsWith('audio/')).toBe(true);
          expect(draft.file_size_bytes).toBeGreaterThanOrEqual(0);
          expect(draft.file_size_bytes).toBeLessThanOrEqual(AUDIO_LIMITS.maxFileBytes);
          expect(draft.duration_seconds).toBeGreaterThanOrEqual(0);
          expect(draft.duration_seconds).toBeLessThanOrEqual(AUDIO_LIMITS.maxDurationSeconds);
          expect(typeof draft.is_active).toBe('boolean');
          expect(draft.storage_path.length).toBeLessThanOrEqual(AUDIO_LIMITS.maxPathLength);
        },
      ),
      RUNS,
    );
  });

  it('é idempotente', () => {
    fc.assert(
      fc.property(fc.record({ name: fc.string(), kind: anyValue }, { requiredKeys: [] }), (raw) => {
        const once = normalizeAudioPromptDraft(raw as never);
        expect(normalizeAudioPromptDraft(once)).toEqual(once);
      }),
      RUNS,
    );
  });

  it('sinaliza nome e arquivo ausentes', () => {
    const draft = normalizeAudioPromptDraft({});
    expect(validateAudioPromptDraft(draft)).toHaveLength(2);
  });
});

describe('queue-audio :: slots', () => {
  it('só retorna faixas ativas e do tipo aceito pelo slot', () => {
    const slots = Object.keys(QUEUE_AUDIO_SLOTS) as QueueAudioSlot[];
    fc.assert(
      fc.property(
        fc.constantFrom(...slots),
        fc.array(
          fc.record({
            kind: fc.constantFrom(...AUDIO_PROMPT_KINDS),
            is_active: fc.boolean(),
          }),
          { maxLength: 20 },
        ),
        (slot, rows) => {
          const prompts = rows.map((row, index) =>
            makePrompt({
              id: `0000000${index}-1111-4111-8111-111111111111`.slice(0, 36),
              kind: row.kind as AudioPromptKind,
              is_active: row.is_active,
            }),
          );
          const accepted = QUEUE_AUDIO_SLOTS[slot] as readonly string[];
          for (const prompt of promptsForSlot(prompts, slot)) {
            expect(prompt.is_active).toBe(true);
            expect(accepted).toContain(prompt.kind);
          }
        },
      ),
      RUNS,
    );
  });

  it('descarta seleção inválida ou desativada', () => {
    const active = makePrompt({ id: 'aaaaaaaa-1111-4111-8111-111111111111', kind: 'moh' });
    const disabled = makePrompt({
      id: 'bbbbbbbb-1111-4111-8111-111111111111',
      kind: 'moh',
      is_active: false,
    });
    const greeting = makePrompt({
      id: 'cccccccc-1111-4111-8111-111111111111',
      kind: 'greeting',
    });
    const all = [active, disabled, greeting];

    expect(resolveSlotSelection(all, 'moh_prompt_id', active.id)).toBe(active.id);
    expect(resolveSlotSelection(all, 'moh_prompt_id', disabled.id)).toBeNull();
    expect(resolveSlotSelection(all, 'moh_prompt_id', greeting.id)).toBeNull();
    expect(resolveSlotSelection(all, 'greeting_prompt_id', greeting.id)).toBe(greeting.id);
    expect(resolveSlotSelection(all, 'moh_prompt_id', null)).toBeNull();
    expect(resolveSlotSelection([], 'moh_prompt_id', active.id)).toBeNull();
  });

  it('aceita posição, tempo de espera e fora de horário no slot periódico', () => {
    const prompts = (['position', 'hold_time', 'off_hours', 'moh'] as AudioPromptKind[]).map(
      (kind, index) =>
        makePrompt({ id: `dddddddd-1111-4111-8111-00000000000${index}`, kind }),
    );
    expect(promptsForSlot(prompts, 'periodic_prompt_id')).toHaveLength(3);
  });
});

describe('queue-audio :: formatação', () => {
  it('formatBytes e formatDuration nunca lançam', () => {
    fc.assert(
      fc.property(anyValue, (value) => {
        expect(typeof formatBytes(value)).toBe('string');
        expect(formatDuration(value)).toMatch(/^\d{2,}:\d{2}$/);
      }),
      RUNS,
    );
  });

  it('formata valores conhecidos', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2,0 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5,0 MB');
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(95)).toBe('01:35');
  });
});
