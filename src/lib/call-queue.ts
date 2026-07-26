/**
 * Lógica pura de filas de atendimento (`public.call_queues`).
 *
 * Mantida fora dos hooks/componentes para permitir property-based testing
 * (ADR-051) e reuso pelas edge functions de execução de fila.
 */

export const QUEUE_STRATEGIES = [
  'ringall',
  'roundrobin',
  'leastrecent',
  'fewestcalls',
  'skillbased',
] as const;

export type QueueStrategy = (typeof QUEUE_STRATEGIES)[number];

export const OVERFLOW_ACTIONS = [
  'voicemail',
  'transfer_queue',
  'callback',
  'hangup',
] as const;

export type OverflowAction = (typeof OVERFLOW_ACTIONS)[number];

/** Limites espelham exatamente os CHECK constraints da migração. */
export const QUEUE_LIMITS = {
  ringTimeout: { min: 5, max: 300 },
  wrapUp: { min: 0, max: 600 },
  maxWait: { min: 10, max: 7200 },
  maxSize: { min: 1, max: 1000 },
  priority: { min: 0, max: 100 },
  announceInterval: { min: 10, max: 600 },
} as const;

export interface CallQueueDraft {
  name: string;
  description: string | null;
  is_active: boolean;
  strategy: QueueStrategy;
  ring_timeout_seconds: number;
  wrap_up_seconds: number;
  max_wait_seconds: number;
  max_queue_size: number;
  priority: number;
  overflow_action: OverflowAction;
  overflow_queue_id: string | null;
  announce_position: boolean;
  announce_hold_time: boolean;
  announce_interval_seconds: number;
  moh_enabled: boolean;
  moh_url: string | null;
  /** Slots de áudio da biblioteca (`queue_audio_prompts`). */
  moh_prompt_id: string | null;
  greeting_prompt_id: string | null;
  periodic_prompt_id: string | null;
  overflow_prompt_id: string | null;
  greeting_enabled: boolean;
}

export interface CallQueue extends CallQueueDraft {
  id: string;
  created_at: string;
  updated_at: string;
}

export const STRATEGY_LABELS: Record<QueueStrategy, string> = {
  ringall: 'Todos tocam juntos',
  roundrobin: 'Rodízio',
  leastrecent: 'Menos recente',
  fewestcalls: 'Menos chamadas',
  skillbased: 'Por habilidade',
};

export const OVERFLOW_LABELS: Record<OverflowAction, string> = {
  voicemail: 'Correio de voz',
  transfer_queue: 'Transferir para outra fila',
  callback: 'Oferecer retorno',
  hangup: 'Encerrar chamada',
};

export const DEFAULT_QUEUE_DRAFT: CallQueueDraft = {
  name: '',
  description: null,
  is_active: true,
  strategy: 'ringall',
  ring_timeout_seconds: 20,
  wrap_up_seconds: 0,
  max_wait_seconds: 300,
  max_queue_size: 50,
  priority: 0,
  overflow_action: 'voicemail',
  overflow_queue_id: null,
  announce_position: false,
  announce_hold_time: false,
  announce_interval_seconds: 30,
  moh_enabled: true,
  moh_url: null,
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
 * Normaliza um rascunho vindo do formulário para um payload que o banco
 * sempre aceita: nenhum CHECK constraint pode ser violado após esta função.
 */
export function normalizeQueueDraft(input: Partial<CallQueueDraft>): CallQueueDraft {
  const strategy: QueueStrategy = QUEUE_STRATEGIES.includes(input.strategy as QueueStrategy)
    ? (input.strategy as QueueStrategy)
    : DEFAULT_QUEUE_DRAFT.strategy;

  const overflowAction: OverflowAction = OVERFLOW_ACTIONS.includes(
    input.overflow_action as OverflowAction,
  )
    ? (input.overflow_action as OverflowAction)
    : DEFAULT_QUEUE_DRAFT.overflow_action;

  const overflowQueueId =
    overflowAction === 'transfer_queue' ? cleanText(input.overflow_queue_id, 64) : null;

  return {
    name: (cleanText(input.name, 120) ?? '').slice(0, 120),
    description: cleanText(input.description, 500),
    is_active: input.is_active !== false,
    strategy,
    ring_timeout_seconds: clampInt(
      input.ring_timeout_seconds,
      QUEUE_LIMITS.ringTimeout.min,
      QUEUE_LIMITS.ringTimeout.max,
      DEFAULT_QUEUE_DRAFT.ring_timeout_seconds,
    ),
    wrap_up_seconds: clampInt(
      input.wrap_up_seconds,
      QUEUE_LIMITS.wrapUp.min,
      QUEUE_LIMITS.wrapUp.max,
      DEFAULT_QUEUE_DRAFT.wrap_up_seconds,
    ),
    max_wait_seconds: clampInt(
      input.max_wait_seconds,
      QUEUE_LIMITS.maxWait.min,
      QUEUE_LIMITS.maxWait.max,
      DEFAULT_QUEUE_DRAFT.max_wait_seconds,
    ),
    max_queue_size: clampInt(
      input.max_queue_size,
      QUEUE_LIMITS.maxSize.min,
      QUEUE_LIMITS.maxSize.max,
      DEFAULT_QUEUE_DRAFT.max_queue_size,
    ),
    priority: clampInt(
      input.priority,
      QUEUE_LIMITS.priority.min,
      QUEUE_LIMITS.priority.max,
      DEFAULT_QUEUE_DRAFT.priority,
    ),
    overflow_action: overflowAction,
    overflow_queue_id: overflowQueueId,
    announce_position: input.announce_position === true,
    announce_hold_time: input.announce_hold_time === true,
    announce_interval_seconds: clampInt(
      input.announce_interval_seconds,
      QUEUE_LIMITS.announceInterval.min,
      QUEUE_LIMITS.announceInterval.max,
      DEFAULT_QUEUE_DRAFT.announce_interval_seconds,
    ),
    moh_enabled: input.moh_enabled !== false,
    moh_url: cleanText(input.moh_url, 2048),
  };
}

/**
 * Erros de negócio que o banco também rejeitaria — antecipados na UI
 * para evitar round-trip e mensagens técnicas do Postgres.
 */
export function validateQueueDraft(
  draft: CallQueueDraft,
  options: { selfId?: string | null } = {},
): string[] {
  const errors: string[] = [];

  if (draft.name.length === 0) {
    errors.push('Informe um nome para a fila.');
  }

  if (draft.overflow_action === 'transfer_queue') {
    if (!draft.overflow_queue_id) {
      errors.push('Escolha a fila de destino do transbordo.');
    } else if (options.selfId && draft.overflow_queue_id === options.selfId) {
      errors.push('A fila de transbordo não pode ser ela mesma.');
    }
  }

  if (draft.moh_url) {
    const isHttp = /^https?:\/\//i.test(draft.moh_url);
    if (!isHttp) {
      errors.push('O áudio de espera deve ser uma URL http(s) válida.');
    }
  }

  if (draft.announce_position && draft.announce_interval_seconds > draft.max_wait_seconds) {
    errors.push('O intervalo de anúncios não pode exceder a espera máxima.');
  }

  return errors;
}

/** Formata segundos em rótulo curto PT-BR (ex.: "2 min 30 s"). */
export function formatSeconds(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.round(totalSeconds)) : 0;
  if (safe < 60) return `${safe} s`;
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  if (seconds === 0) return `${minutes} min`;
  return `${minutes} min ${seconds} s`;
}

/**
 * Quantos ciclos de toque cabem na espera máxima configurada.
 * Usado para alertar sobre configurações incoerentes (ex.: espera curta demais).
 */
export function ringCyclesWithinWait(draft: CallQueueDraft): number {
  const cycle = draft.ring_timeout_seconds + draft.wrap_up_seconds;
  if (cycle <= 0) return 0;
  return Math.floor(draft.max_wait_seconds / cycle);
}
