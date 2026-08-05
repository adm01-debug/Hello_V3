/**
 * Toques configuráveis para chamadas recebidas.
 *
 * Cada preset descreve uma sequência de tons sintetizados via WebAudio, para
 * não depender de arquivos de áudio externos (que falhariam offline ou sob
 * políticas restritivas de mídia).
 */

import { logger } from '@/lib/logger';

const log = logger.create('RingtonePresets');

export interface RingtoneTone {
  /** Frequência em Hz. */
  freq: number;
  /** Deslocamento do início do tom dentro do ciclo, em ms. */
  offsetMs: number;
  /** Duração do tom, em ms. */
  durationMs: number;
}

export interface RingtonePreset {
  id: string;
  label: string;
  description: string;
  /** Duração total do ciclo (toque + silêncio), em ms. */
  cycleMs: number;
  tones: readonly RingtoneTone[];
}

export const RINGTONE_PRESETS: readonly RingtonePreset[] = [
  {
    id: 'classic',
    label: 'Clássico (BR)',
    description: '1s de toque a cada 5s, padrão da telefonia brasileira.',
    cycleMs: 5000,
    tones: [{ freq: 440, offsetMs: 0, durationMs: 1000 }],
  },
  {
    id: 'double',
    label: 'Duplo',
    description: 'Dois toques curtos em sequência, estilo europeu.',
    cycleMs: 4000,
    tones: [
      { freq: 480, offsetMs: 0, durationMs: 400 },
      { freq: 480, offsetMs: 600, durationMs: 400 },
    ],
  },
  {
    id: 'digital',
    label: 'Digital',
    description: 'Três bipes ascendentes, mais perceptível em ambientes ruidosos.',
    cycleMs: 3000,
    tones: [
      { freq: 660, offsetMs: 0, durationMs: 180 },
      { freq: 880, offsetMs: 240, durationMs: 180 },
      { freq: 1100, offsetMs: 480, durationMs: 220 },
    ],
  },
  {
    id: 'soft',
    label: 'Suave',
    description: 'Tom grave e longo, discreto para ambientes compartilhados.',
    cycleMs: 6000,
    tones: [{ freq: 320, offsetMs: 0, durationMs: 1400 }],
  },
  {
    id: 'silent',
    label: 'Silencioso',
    description: 'Sem áudio — mantém apenas a notificação visual.',
    cycleMs: 5000,
    tones: [],
  },
] as const;

export const DEFAULT_RINGTONE_ID = 'classic';
export const RINGTONE_STORAGE_KEY = 'dialer.ringtone.preset';
export const RINGTONE_VOLUME_STORAGE_KEY = 'dialer.ringtone.volume';

export const MIN_VOLUME = 0;
export const MAX_VOLUME = 1;
export const DEFAULT_VOLUME = 0.12;

/** Resolve um preset pelo id, com fallback seguro para o padrão. */
export function getRingtonePreset(id: unknown): RingtonePreset {
  const fallback =
    RINGTONE_PRESETS.find((preset) => preset.id === DEFAULT_RINGTONE_ID) ?? RINGTONE_PRESETS[0];
  if (typeof id !== 'string') return fallback;
  return RINGTONE_PRESETS.find((preset) => preset.id === id) ?? fallback;
}

/** Restringe o volume ao intervalo válido, tratando NaN/Infinity/strings. */
export function clampVolume(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_VOLUME;
  if (numeric < MIN_VOLUME) return MIN_VOLUME;
  if (numeric > MAX_VOLUME) return MAX_VOLUME;
  return numeric;
}

function safeStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    // Modo privado/bloqueio de cookies pode lançar ao acessar localStorage.
    return null;
  }
}

export interface RingtoneSettings {
  presetId: string;
  volume: number;
}

/** Lê a preferência persistida, sempre retornando valores válidos. */
export function loadRingtoneSettings(): RingtoneSettings {
  const storage = safeStorage();
  if (!storage) return { presetId: DEFAULT_RINGTONE_ID, volume: DEFAULT_VOLUME };
  try {
    const presetId = getRingtonePreset(storage.getItem(RINGTONE_STORAGE_KEY)).id;
    const rawVolume = storage.getItem(RINGTONE_VOLUME_STORAGE_KEY);
    const volume = rawVolume === null ? DEFAULT_VOLUME : clampVolume(rawVolume);
    return { presetId, volume };
  } catch (error) {
    log.warn('Falha ao ler preferências de toque', error);
    return { presetId: DEFAULT_RINGTONE_ID, volume: DEFAULT_VOLUME };
  }
}

/** Persiste a preferência; falhas de storage nunca quebram o discador. */
export function saveRingtoneSettings(settings: Partial<RingtoneSettings>): void {
  const storage = safeStorage();
  if (!storage) return;
  try {
    if (settings.presetId !== undefined) {
      storage.setItem(RINGTONE_STORAGE_KEY, getRingtonePreset(settings.presetId).id);
    }
    if (settings.volume !== undefined) {
      storage.setItem(RINGTONE_VOLUME_STORAGE_KEY, String(clampVolume(settings.volume)));
    }
  } catch (error) {
    log.warn('Falha ao salvar preferências de toque', error);
  }
}
