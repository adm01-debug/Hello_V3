/**
 * Lógica pura de grupos de toque (`public.ring_groups`).
 *
 * Espelha exatamente os CHECK constraints e o trigger `validate_ring_group`
 * da migração, de forma que a UI nunca consiga produzir um payload rejeitado
 * pelo banco. Mantido fora de hooks/componentes para permitir PBT (ADR-051).
 */

export const RING_STRATEGIES = ['ringall', 'sequential', 'roundrobin', 'random'] as const;
export type RingStrategy = (typeof RING_STRATEGIES)[number];

export const NO_ANSWER_ACTIONS = [
  'voicemail',
  'forward_extension',
  'forward_queue',
  'hangup',
] as const;
export type NoAnswerAction = (typeof NO_ANSWER_ACTIONS)[number];

/** Faixas idênticas às do banco. */
export const RING_GROUP_LIMITS = {
  ringTimeout: { min: 5, max: 300 },
  stepTimeout: { min: 5, max: 120 },
  ringOrder: { min: 0, max: 999 },
  memberDelay: { min: 0, max: 300 },
} as const;

export const RING_STRATEGY_LABELS: Record<RingStrategy, string> = {
  ringall: 'Todos tocam juntos',
  sequential: 'Sequencial (cascata)',
  roundrobin: 'Rodízio',
  random: 'Aleatório',
};

export const NO_ANSWER_LABELS: Record<NoAnswerAction, string> = {
  voicemail: 'Correio de voz',
  forward_extension: 'Encaminhar para ramal',
  forward_queue: 'Encaminhar para fila',
  hangup: 'Encerrar chamada',
};

export interface RingGroupDraft {
  name: string;
  description: string | null;
  extension: string | null;
  is_active: boolean;
  strategy: RingStrategy;
  ring_timeout_seconds: number;
  step_timeout_seconds: number;
  no_answer_action: NoAnswerAction;
  forward_target: string | null;
  skip_busy_agents: boolean;
}

export interface RingGroup extends RingGroupDraft {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface RingGroupMember {
  id: string;
  group_id: string;
  agent_id: string;
  ring_order: number;
  delay_seconds: number;
  is_enabled: boolean;
}

export const DEFAULT_RING_GROUP_DRAFT: RingGroupDraft = {
  name: '',
  description: null,
  extension: null,
  is_active: true,
  strategy: 'ringall',
  ring_timeout_seconds: 25,
  step_timeout_seconds: 15,
  no_answer_action: 'voicemail',
  forward_target: null,
  skip_busy_agents: true,
};

/** Recorta um inteiro para dentro da faixa aceita pelo banco. */
export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  let parsed: number;
  if (typeof value === 'number') {
    parsed = value;
  } else {
    // `Number(x)` lança para símbolos e objetos sem conversão primitiva.
    try {
      parsed = Number(value);
    } catch {
      return fallback;
    }
  }
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.round(parsed);
  if (rounded < min) return min;
  if (rounded > max) return max;
  return rounded;
}

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, maxLength);
}

/**
 * Normaliza o ramal virtual para o padrão aceito pelo CHECK
 * `^[0-9*#+]{1,20}$` — caracteres inválidos são descartados.
 */
export function sanitizeExtension(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const filtered = value.replace(/[^0-9*#+]/g, '').slice(0, 20);
  return filtered.length > 0 ? filtered : null;
}

/**
 * Normaliza um rascunho para um payload sempre aceito pelo banco:
 * nenhum CHECK constraint nem o trigger de validação pode falhar depois disto.
 */
export function normalizeRingGroupDraft(
  raw: Partial<RingGroupDraft> | null | undefined,
): RingGroupDraft {
  // Defesa contra entradas não-objeto (null, primitivos, arrays de API externa).
  const input: Partial<RingGroupDraft> =
    typeof raw === 'object' && raw !== null && !Array.isArray(raw)
      ? raw
      : {};

  const strategy: RingStrategy = RING_STRATEGIES.includes(input.strategy as RingStrategy)
    ? (input.strategy as RingStrategy)
    : DEFAULT_RING_GROUP_DRAFT.strategy;

  const noAnswerAction: NoAnswerAction = NO_ANSWER_ACTIONS.includes(
    input.no_answer_action as NoAnswerAction,
  )
    ? (input.no_answer_action as NoAnswerAction)
    : DEFAULT_RING_GROUP_DRAFT.no_answer_action;

  const extension = sanitizeExtension(input.extension);

  // O trigger zera o destino quando a ação não é de encaminhamento;
  // fazemos o mesmo aqui para manter UI e banco coerentes.
  const forwardTarget =
    noAnswerAction === 'forward_extension' || noAnswerAction === 'forward_queue'
      ? cleanText(input.forward_target, 120)
      : null;

  return {
    name: (cleanText(input.name, 120) ?? '').slice(0, 120),
    description: cleanText(input.description, 500),
    extension,
    is_active: input.is_active !== false,
    strategy,
    ring_timeout_seconds: clampInt(
      input.ring_timeout_seconds,
      RING_GROUP_LIMITS.ringTimeout.min,
      RING_GROUP_LIMITS.ringTimeout.max,
      DEFAULT_RING_GROUP_DRAFT.ring_timeout_seconds,
    ),
    step_timeout_seconds: clampInt(
      input.step_timeout_seconds,
      RING_GROUP_LIMITS.stepTimeout.min,
      RING_GROUP_LIMITS.stepTimeout.max,
      DEFAULT_RING_GROUP_DRAFT.step_timeout_seconds,
    ),
    no_answer_action: noAnswerAction,
    forward_target: forwardTarget,
    skip_busy_agents: input.skip_busy_agents !== false,
  };
}

/**
 * Erros de negócio que o banco também rejeitaria — antecipados na UI
 * para evitar round-trip e mensagens técnicas do Postgres.
 */
export function validateRingGroupDraft(
  draft: RingGroupDraft,
  options: { existingExtensions?: readonly string[] } = {},
): string[] {
  const errors: string[] = [];

  if (draft.name.length === 0) {
    errors.push('Informe um nome para o grupo.');
  }

  if (
    draft.no_answer_action === 'forward_extension' ||
    draft.no_answer_action === 'forward_queue'
  ) {
    if (!draft.forward_target) {
      errors.push('Informe o destino do encaminhamento.');
    } else if (
      draft.no_answer_action === 'forward_extension' &&
      draft.extension &&
      draft.forward_target === draft.extension
    ) {
      errors.push('O grupo não pode encaminhar para o próprio ramal.');
    }
  }

  if (draft.extension && options.existingExtensions?.includes(draft.extension)) {
    errors.push('Este ramal virtual já está em uso por outro grupo.');
  }

  return errors;
}

/**
 * Tempo máximo de toque antes de cair na ação de "ninguém atendeu".
 * No modo sequencial cada participante habilitado consome uma etapa
 * (respeitando o atraso individual); nos demais modos todos tocam juntos.
 */
export function estimateRingDurationSeconds(
  draft: RingGroupDraft,
  members: readonly Pick<RingGroupMember, 'delay_seconds' | 'is_enabled'>[],
): number {
  const enabled = members.filter((member) => member.is_enabled);
  if (enabled.length === 0) return 0;

  if (draft.strategy !== 'sequential') {
    const maxDelay = enabled.reduce(
      (acc, member) => Math.max(acc, clampInt(member.delay_seconds, 0, 300, 0)),
      0,
    );
    return Math.min(draft.ring_timeout_seconds, maxDelay + draft.ring_timeout_seconds);
  }

  const total = enabled.reduce(
    (acc, member) => acc + clampInt(member.delay_seconds, 0, 300, 0) + draft.step_timeout_seconds,
    0,
  );
  return Math.min(total, draft.ring_timeout_seconds * enabled.length);
}

/** Formata segundos em rótulo curto PT-BR (ex.: "2 min 30 s"). */
export function formatRingSeconds(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.round(totalSeconds)) : 0;
  if (safe < 60) return `${safe} s`;
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  if (seconds === 0) return `${minutes} min`;
  return `${minutes} min ${seconds} s`;
}

/** Reordena participantes garantindo `ring_order` contíguo a partir de zero. */
export function reindexMembers<T extends { ring_order: number }>(members: readonly T[]): T[] {
  return [...members]
    .sort((a, b) => a.ring_order - b.ring_order)
    .map((member, index) => ({ ...member, ring_order: index }));
}
