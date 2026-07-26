/**
 * Estacionamento de chamadas (park orbits) — lógica pura.
 *
 * Espelha 1:1 os CHECK constraints e os triggers `validate_park_orbit` e
 * `validate_parked_call`, de modo que nenhuma escrita saia do cliente com um
 * payload que o banco vá recusar. Todas as funções são defensivas: aceitam
 * `unknown` sem lançar, porque também servem para normalizar payloads vindos
 * de importações e de webhooks externos.
 */

export const PARK_TIMEOUT_ACTIONS = [
  'return_parker',
  'ring_group',
  'queue',
  'extension',
  'voicemail',
  'hangup',
] as const;
export type ParkTimeoutAction = (typeof PARK_TIMEOUT_ACTIONS)[number];

export const PARK_TIMEOUT_ACTION_LABELS: Record<ParkTimeoutAction, string> = {
  return_parker: 'Retornar a quem estacionou',
  ring_group: 'Encaminhar para grupo de toque',
  queue: 'Encaminhar para fila',
  extension: 'Encaminhar para ramal',
  voicemail: 'Enviar ao correio de voz',
  hangup: 'Encerrar a chamada',
};

/** Ações que exigem um destino textual preenchido (igual ao trigger). */
export const ACTIONS_REQUIRING_TARGET: readonly ParkTimeoutAction[] = [
  'ring_group',
  'queue',
  'extension',
];

export const PARKED_CALL_STATUSES = ['parked', 'retrieved', 'expired', 'abandoned'] as const;
export type ParkedCallStatus = (typeof PARKED_CALL_STATUSES)[number];

export const PARKED_CALL_STATUS_LABELS: Record<ParkedCallStatus, string> = {
  parked: 'Estacionada',
  retrieved: 'Retirada',
  expired: 'Expirada',
  abandoned: 'Abandonada',
};

export const PARK_LIMITS = {
  minSlot: 1,
  maxSlot: 99999,
  /** slot_end - slot_start <= 99 → no máximo 100 vagas por órbita. */
  maxSlotsPerOrbit: 100,
  minTimeoutSeconds: 30,
  maxTimeoutSeconds: 3600,
  maxNameLength: 80,
  maxDescriptionLength: 400,
  maxTargetLength: 80,
} as const;

export interface CallParkOrbit {
  id: string;
  name: string;
  description: string | null;
  slot_start: number;
  slot_end: number;
  park_timeout_seconds: number;
  timeout_action: ParkTimeoutAction;
  timeout_target: string | null;
  moh_prompt_id: string | null;
  announce_slot: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CallParkOrbitDraft {
  name: string;
  description: string | null;
  slot_start: number;
  slot_end: number;
  park_timeout_seconds: number;
  timeout_action: ParkTimeoutAction;
  timeout_target: string | null;
  moh_prompt_id: string | null;
  announce_slot: boolean;
  is_active: boolean;
}

export interface ParkedCall {
  id: string;
  orbit_id: string;
  slot_number: number;
  call_session_id: string | null;
  contact_phone: string | null;
  contact_name: string | null;
  parked_by: string | null;
  parked_by_name: string | null;
  retrieved_by: string | null;
  retrieved_by_name: string | null;
  status: ParkedCallStatus;
  parked_at: string;
  expires_at: string;
  retrieved_at: string | null;
  notes: string | null;
}

export const DEFAULT_ORBIT_DRAFT: CallParkOrbitDraft = {
  name: '',
  description: null,
  slot_start: 701,
  slot_end: 710,
  park_timeout_seconds: 180,
  timeout_action: 'return_parker',
  timeout_target: null,
  moh_prompt_id: null,
  announce_slot: true,
  is_active: true,
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Converte qualquer valor em inteiro dentro da faixa, sem jamais lançar.
 * `Number(symbol)` e objetos sem conversão primitiva lançam TypeError — por
 * isso a conversão acontece dentro de try/catch (defeito real capturado por
 * PBT nas ondas anteriores em `call-queue.ts` e `ring-group.ts`).
 */
export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  let numeric: number;
  try {
    if (typeof value === 'number') numeric = value;
    else if (typeof value === 'string') numeric = Number(value.trim());
    else if (typeof value === 'boolean') numeric = value ? 1 : 0;
    else return clampBounds(fallback, min, max);
  } catch {
    return clampBounds(fallback, min, max);
  }
  if (!Number.isFinite(numeric)) return clampBounds(fallback, min, max);
  return clampBounds(Math.round(numeric), min, max);
}

function clampBounds(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function cleanNullableText(value: unknown, maxLength: number): string | null {
  const text = cleanText(value, maxLength);
  return text.length > 0 ? text : null;
}

function cleanUuid(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return UUID_RE.test(trimmed) ? trimmed.toLowerCase() : null;
}

function cleanBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function cleanAction(value: unknown): ParkTimeoutAction {
  return typeof value === 'string' &&
    (PARK_TIMEOUT_ACTIONS as readonly string[]).includes(value)
    ? (value as ParkTimeoutAction)
    : 'return_parker';
}

/** Normaliza um rascunho de órbita para um payload sempre aceito pelo banco. */
export function normalizeOrbitDraft(input: unknown): CallParkOrbitDraft {
  if (input === null || typeof input !== 'object') return { ...DEFAULT_ORBIT_DRAFT };
  const raw = input as Record<string, unknown>;

  const action = cleanAction(raw.timeout_action);
  const start = clampInt(
    raw.slot_start,
    PARK_LIMITS.minSlot,
    PARK_LIMITS.maxSlot,
    DEFAULT_ORBIT_DRAFT.slot_start,
  );
  // O fim nunca pode ficar antes do início nem estourar 100 vagas.
  const end = clampInt(
    raw.slot_end,
    start,
    Math.min(PARK_LIMITS.maxSlot, start + PARK_LIMITS.maxSlotsPerOrbit - 1),
    Math.min(PARK_LIMITS.maxSlot, start + 9),
  );

  return {
    name: cleanText(raw.name, PARK_LIMITS.maxNameLength),
    description: cleanNullableText(raw.description, PARK_LIMITS.maxDescriptionLength),
    slot_start: start,
    slot_end: end,
    park_timeout_seconds: clampInt(
      raw.park_timeout_seconds,
      PARK_LIMITS.minTimeoutSeconds,
      PARK_LIMITS.maxTimeoutSeconds,
      DEFAULT_ORBIT_DRAFT.park_timeout_seconds,
    ),
    timeout_action: action,
    timeout_target: ACTIONS_REQUIRING_TARGET.includes(action)
      ? cleanNullableText(raw.timeout_target, PARK_LIMITS.maxTargetLength)
      : null,
    moh_prompt_id: cleanUuid(raw.moh_prompt_id),
    announce_slot: cleanBoolean(raw.announce_slot, true),
    is_active: cleanBoolean(raw.is_active, true),
  };
}

/** Quantidade de vagas da faixa. Sempre >= 1 após normalização. */
export function slotCount(draft: Pick<CallParkOrbitDraft, 'slot_start' | 'slot_end'>): number {
  const count = draft.slot_end - draft.slot_start + 1;
  return count > 0 ? count : 0;
}

/** Lista as vagas de uma órbita, em ordem crescente. */
export function slotsOf(orbit: Pick<CallParkOrbit, 'slot_start' | 'slot_end'>): number[] {
  const slots: number[] = [];
  for (let slot = orbit.slot_start; slot <= orbit.slot_end; slot += 1) slots.push(slot);
  return slots;
}

/** Duas faixas se sobrepõem? Espelha a checagem do trigger. */
export function rangesOverlap(
  a: Pick<CallParkOrbitDraft, 'slot_start' | 'slot_end'>,
  b: Pick<CallParkOrbitDraft, 'slot_start' | 'slot_end'>,
): boolean {
  return a.slot_start <= b.slot_end && a.slot_end >= b.slot_start;
}

/**
 * Valida o rascunho contra as mesmas regras do banco.
 * `otherActiveOrbits` deve conter apenas órbitas ativas diferentes da editada.
 */
export function validateOrbitDraft(
  draft: CallParkOrbitDraft,
  otherActiveOrbits: readonly Pick<CallParkOrbit, 'name' | 'slot_start' | 'slot_end'>[] = [],
): string[] {
  const errors: string[] = [];

  if (draft.name.length === 0) errors.push('Informe um nome para a órbita.');
  if (draft.slot_end < draft.slot_start) {
    errors.push('A vaga final precisa ser maior ou igual à inicial.');
  }
  if (slotCount(draft) > PARK_LIMITS.maxSlotsPerOrbit) {
    errors.push(`Uma órbita comporta no máximo ${PARK_LIMITS.maxSlotsPerOrbit} vagas.`);
  }
  if (ACTIONS_REQUIRING_TARGET.includes(draft.timeout_action) && !draft.timeout_target) {
    errors.push('Informe o destino para a ação de tempo esgotado escolhida.');
  }
  if (draft.is_active) {
    const conflict = otherActiveOrbits.find((orbit) => rangesOverlap(draft, orbit));
    if (conflict) {
      errors.push(
        `A faixa ${draft.slot_start}-${draft.slot_end} se sobrepõe à órbita "${conflict.name}".`,
      );
    }
  }

  return errors;
}

/** Primeira vaga livre da órbita, ou null se estiver lotada. */
export function firstFreeSlot(
  orbit: Pick<CallParkOrbit, 'id' | 'slot_start' | 'slot_end'>,
  parked: readonly Pick<ParkedCall, 'orbit_id' | 'slot_number' | 'status'>[],
): number | null {
  const taken = new Set(
    parked
      .filter((call) => call.orbit_id === orbit.id && call.status === 'parked')
      .map((call) => call.slot_number),
  );
  for (const slot of slotsOf(orbit)) {
    if (!taken.has(slot)) return slot;
  }
  return null;
}

/** Segundos restantes até a expiração; 0 quando já venceu ou é inválido. */
export function secondsRemaining(expiresAt: unknown, now: number = Date.now()): number {
  if (typeof expiresAt !== 'string') return 0;
  const timestamp = Date.parse(expiresAt);
  if (!Number.isFinite(timestamp)) return 0;
  const diff = Math.floor((timestamp - now) / 1000);
  return diff > 0 ? diff : 0;
}

/** mm:ss defensivo — nunca retorna NaN. */
export function formatCountdown(totalSeconds: unknown): string {
  const seconds = clampInt(totalSeconds, 0, 359_999, 0);
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

/** Rótulo do resumo de tempo limite ("3 min", "45 s"). */
export function formatTimeout(totalSeconds: unknown): string {
  const seconds = clampInt(
    totalSeconds,
    PARK_LIMITS.minTimeoutSeconds,
    PARK_LIMITS.maxTimeoutSeconds,
    PARK_LIMITS.minTimeoutSeconds,
  );
  if (seconds % 60 === 0) return `${seconds / 60} min`;
  return `${seconds} s`;
}

/** Últimos 4 dígitos, para não expor o telefone completo em murais e logs. */
export function maskPhone(value: unknown): string {
  if (typeof value !== 'string') return '—';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '—';
  if (digits.length <= 4) return `••${digits}`;
  return `••••${digits.slice(-4)}`;
}
