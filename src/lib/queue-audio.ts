/**
 * Lógica pura da biblioteca de áudios de fila (`public.queue_audio_prompts`).
 *
 * Espelha 1:1 os CHECK constraints da migração e o trigger
 * `validate_queue_audio_slots`, para que a UI nunca envie um payload que o
 * banco rejeitaria. Mantida fora de hooks/componentes para permitir
 * property-based testing (ADR-051).
 */

export const AUDIO_PROMPT_KINDS = [
  'moh',
  'greeting',
  'position',
  'hold_time',
  'overflow',
  'off_hours',
] as const;

export type AudioPromptKind = (typeof AUDIO_PROMPT_KINDS)[number];

export const AUDIO_PROMPT_KIND_LABELS: Record<AudioPromptKind, string> = {
  moh: 'Música em espera',
  greeting: 'Saudação inicial',
  position: 'Posição na fila',
  hold_time: 'Tempo estimado de espera',
  overflow: 'Transbordo / fila cheia',
  off_hours: 'Fora do horário',
};

/** Slots de áudio existentes em `call_queues` e os tipos aceitos por cada um. */
export const QUEUE_AUDIO_SLOTS = {
  moh_prompt_id: ['moh'],
  greeting_prompt_id: ['greeting'],
  periodic_prompt_id: ['position', 'hold_time', 'off_hours'],
  overflow_prompt_id: ['overflow'],
} as const satisfies Record<string, readonly AudioPromptKind[]>;

export type QueueAudioSlot = keyof typeof QUEUE_AUDIO_SLOTS;

export const QUEUE_AUDIO_SLOT_LABELS: Record<QueueAudioSlot, string> = {
  moh_prompt_id: 'Música em espera',
  greeting_prompt_id: 'Saudação ao entrar na fila',
  periodic_prompt_id: 'Anúncio periódico',
  overflow_prompt_id: 'Aviso de transbordo',
};

/** Limites idênticos aos CHECK constraints e ao bucket `queue-audio`. */
export const AUDIO_LIMITS = {
  maxFileBytes: 20 * 1024 * 1024,
  maxDurationSeconds: 3600,
  maxNameLength: 120,
  maxDescriptionLength: 500,
  maxPathLength: 1024,
} as const;

export const ALLOWED_AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/webm',
  'audio/aac',
  'audio/mp4',
] as const;

export interface QueueAudioPromptDraft {
  name: string;
  description: string | null;
  kind: AudioPromptKind;
  storage_path: string;
  mime_type: string;
  file_size_bytes: number;
  duration_seconds: number;
  is_active: boolean;
}

export interface QueueAudioPrompt extends QueueAudioPromptDraft {
  id: string;
  created_at: string;
  updated_at: string;
}

/** Metadados mínimos de arquivo — evita depender de `File` (indisponível em Node). */
export interface AudioFileLike {
  name: string;
  size: number;
  type: string;
}

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, maxLength);
}

/** Recorta um número para a faixa aceita pelo banco, tolerando entradas hostis. */
export function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
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

/**
 * Converte o nome original do arquivo em um segmento de caminho seguro:
 * sem separadores, sem travessia (`..`), sem acentos e sempre não vazio.
 */
export function sanitizeFileName(rawName: unknown): string {
  const base = typeof rawName === 'string' ? rawName : '';
  const withoutFolders = base.split(/[\\/]/).pop() ?? '';
  const normalized = withoutFolders
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/\.{2,}/g, '.')
    .replace(/^[-.]+/, '')
    .replace(/[-.]+$/, '')
    .slice(0, 80);
  return normalized.length > 0 ? normalized : 'audio';
}

/**
 * Caminho determinístico dentro do bucket privado `queue-audio`.
 * O prefixo por tipo mantém a listagem organizada e evita colisões entre filas.
 */
export function buildStoragePath(
  kind: AudioPromptKind,
  fileName: unknown,
  uniqueId: string,
): string {
  const safeKind: AudioPromptKind = AUDIO_PROMPT_KINDS.includes(kind) ? kind : 'moh';
  const safeId = sanitizeFileName(uniqueId).slice(0, 40) || 'item';
  const path = `${safeKind}/${safeId}-${sanitizeFileName(fileName)}`;
  return path.slice(0, AUDIO_LIMITS.maxPathLength);
}

/** Valida o arquivo antes do upload, com mensagens em PT-BR. */
export function validateAudioFile(file: AudioFileLike | null | undefined): string[] {
  const errors: string[] = [];
  if (!file || typeof file !== 'object') {
    return ['Selecione um arquivo de áudio.'];
  }

  const size = typeof file.size === 'number' && Number.isFinite(file.size) ? file.size : -1;
  if (size <= 0) {
    errors.push('O arquivo de áudio está vazio ou inválido.');
  } else if (size > AUDIO_LIMITS.maxFileBytes) {
    errors.push('O arquivo excede o limite de 20 MB.');
  }

  const mime = typeof file.type === 'string' ? file.type.toLowerCase() : '';
  if (!(ALLOWED_AUDIO_MIME_TYPES as readonly string[]).includes(mime)) {
    errors.push('Formato não suportado. Use MP3, WAV, OGG, AAC ou M4A.');
  }

  return errors;
}

/** Normaliza o rascunho para um payload que o banco sempre aceita. */
export function normalizeAudioPromptDraft(
  input: Partial<QueueAudioPromptDraft>,
): QueueAudioPromptDraft {
  const kind: AudioPromptKind = AUDIO_PROMPT_KINDS.includes(input.kind as AudioPromptKind)
    ? (input.kind as AudioPromptKind)
    : 'moh';

  const rawMime = cleanText(input.mime_type, 100)?.toLowerCase() ?? '';
  const mime = (ALLOWED_AUDIO_MIME_TYPES as readonly string[]).includes(rawMime)
    ? rawMime
    : 'audio/mpeg';

  return {
    name: cleanText(input.name, AUDIO_LIMITS.maxNameLength) ?? '',
    description: cleanText(input.description, AUDIO_LIMITS.maxDescriptionLength),
    kind,
    storage_path: cleanText(input.storage_path, AUDIO_LIMITS.maxPathLength) ?? '',
    mime_type: mime,
    file_size_bytes: clampNumber(input.file_size_bytes, 0, AUDIO_LIMITS.maxFileBytes, 0),
    duration_seconds: clampNumber(input.duration_seconds, 0, AUDIO_LIMITS.maxDurationSeconds, 0),
    is_active: input.is_active !== false,
  };
}

/** Erros de negócio antecipados na UI (o banco também os rejeitaria). */
export function validateAudioPromptDraft(draft: QueueAudioPromptDraft): string[] {
  const errors: string[] = [];
  if (draft.name.length === 0) errors.push('Informe um nome para o áudio.');
  if (draft.storage_path.length === 0) errors.push('Envie o arquivo de áudio.');
  return errors;
}

/**
 * Áudios elegíveis para um slot de fila — replica o trigger
 * `validate_queue_audio_slots` (tipo compatível E ativo).
 */
export function promptsForSlot(
  prompts: readonly QueueAudioPrompt[],
  slot: QueueAudioSlot,
): QueueAudioPrompt[] {
  const accepted = QUEUE_AUDIO_SLOTS[slot] as readonly AudioPromptKind[];
  if (!Array.isArray(prompts)) return [];
  return prompts.filter(
    (prompt) =>
      prompt != null &&
      prompt.is_active === true &&
      accepted.includes(prompt.kind as AudioPromptKind),
  );
}

/**
 * Garante que a seleção de um slot ainda é válida — usado ao reabrir o
 * formulário depois que um áudio foi desativado ou trocado de tipo.
 */
export function resolveSlotSelection(
  prompts: readonly QueueAudioPrompt[],
  slot: QueueAudioSlot,
  selectedId: string | null | undefined,
): string | null {
  if (typeof selectedId !== 'string' || selectedId.length === 0) return null;
  return promptsForSlot(prompts, slot).some((prompt) => prompt.id === selectedId)
    ? selectedId
    : null;
}

/** Formata bytes em rótulo curto PT-BR. */
export function formatBytes(bytes: unknown): string {
  const safe = clampNumber(bytes, 0, Number.MAX_SAFE_INTEGER, 0);
  if (safe < 1024) return `${safe} B`;
  if (safe < 1024 * 1024) return `${(safe / 1024).toFixed(1).replace('.', ',')} KB`;
  return `${(safe / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

/** Formata duração em mm:ss. */
export function formatDuration(seconds: unknown): string {
  const safe = clampNumber(seconds, 0, AUDIO_LIMITS.maxDurationSeconds, 0);
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}
