/**
 * Alerta de chamada recebida: toque (WebAudio) + notificação nativa.
 *
 * Implementação defensiva: qualquer API ausente (AudioContext, Notification)
 * degrada silenciosamente, pois o discador precisa funcionar em navegadores
 * restritos, SSR/JSDOM e contextos sem permissão de áudio/notificações.
 */

import { logger } from '@/lib/logger';
import {
  clampVolume,
  getRingtonePreset,
  loadRingtoneSettings,
  type RingtonePreset,
} from '@/lib/ringtone-presets';

const log = logger.create('IncomingCallAlert');

/** Cadência clássica de telefonia BR: 1s de toque, 4s de silêncio. */
export const RING_ON_MS = 1000;
export const RING_CYCLE_MS = 5000;

interface AlertHandle {
  stop: () => void;
}

export interface RingtoneOptions {
  /** Id do preset; quando omitido usa a preferência salva do usuário. */
  presetId?: string;
  /** Volume 0..1; quando omitido usa a preferência salva do usuário. */
  volume?: number;
}

type AudioContextCtor = typeof AudioContext;

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

function resolveOptions(options?: RingtoneOptions): { preset: RingtonePreset; volume: number } {
  const stored = loadRingtoneSettings();
  const preset = getRingtonePreset(options?.presetId ?? stored.presetId);
  const volume = clampVolume(options?.volume ?? stored.volume);
  return { preset, volume };
}

/** Inicia o toque em loop. Retorna um handle idempotente para parar. */
export function startRingtone(options?: RingtoneOptions): AlertHandle {
  const { preset, volume } = resolveOptions(options);
  const Ctor = getAudioContextCtor();
  // Preset silencioso ou volume zerado: nada a tocar, mas o handle é válido.
  if (!Ctor || preset.tones.length === 0 || volume <= 0) return { stop: () => undefined };

  let context: AudioContext | null = null;
  let interval: ReturnType<typeof setInterval> | null = null;
  let stopped = false;

  try {
    context = new Ctor();
  } catch (error) {
    log.warn('AudioContext indisponível para o toque', error);
    return { stop: () => undefined };
  }

  const playCycle = () => {
    if (stopped || !context || context.state === 'closed') return;
    for (const tone of preset.tones) {
      try {
        const startAt = context.currentTime + tone.offsetMs / 1000;
        const endAt = startAt + tone.durationMs / 1000;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = tone.freq;
        gain.gain.setValueAtTime(volume, startAt);
        // Fade-out curto evita "click" audível ao final do toque.
        gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(startAt);
        oscillator.stop(endAt);
      } catch (error) {
        log.warn('Falha ao emitir toque', error);
      }
    }
  };

  // Autoplay policy: se o contexto estiver suspenso, tenta retomar.
  if (context.state === 'suspended' && typeof context.resume === 'function') {
    void Promise.resolve(context.resume()).catch(() => undefined);
  }

  playCycle();
  interval = setInterval(playCycle, preset.cycleMs);

  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      if (interval) clearInterval(interval);
      interval = null;
      try {
        void Promise.resolve(context?.close?.()).catch(() => undefined);
      } catch {
        /* contexto já encerrado */
      }
      context = null;
    },
  };
}

/** Toca uma única vez o preset informado (pré-escuta nas preferências). */
export function previewRingtone(presetId: string, volume?: number): void {
  const handle = startRingtone({ presetId, volume });
  const { preset } = resolveOptions({ presetId, volume });
  const durationMs = preset.tones.reduce(
    (max, tone) => Math.max(max, tone.offsetMs + tone.durationMs),
    0,
  );
  if (typeof window === 'undefined') {
    handle.stop();
    return;
  }
  window.setTimeout(() => handle.stop(), durationMs + 200);
}

/**
 * Exibe notificação nativa da chamada recebida (quando permitido).
 * Retorna uma função para fechá-la.
 */
export function showIncomingNotification(title: string, body: string): () => void {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return () => undefined;
  }
  if (Notification.permission !== 'granted') {
    // Não solicita permissão aqui: pedido sem gesto do usuário é bloqueado
    // e polui a UX. A permissão é requisitada em `ensureNotificationPermission`.
    return () => undefined;
  }
  try {
    const notification = new Notification(title, {
      body,
      tag: 'incoming-call',
      requireInteraction: true,
    });
    notification.onclick = () => {
      try {
        window.focus();
      } finally {
        notification.close();
      }
    };
    return () => {
      try {
        notification.close();
      } catch {
        /* já fechada */
      }
    };
  } catch (error) {
    log.warn('Notificação nativa indisponível', error);
    return () => undefined;
  }
}

/** Solicita permissão de notificação a partir de um gesto do usuário. */
export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

/** Combina toque + notificação em um único ciclo de vida. */
export function startIncomingCallAlert(
  title: string,
  body: string,
  options?: RingtoneOptions,
): AlertHandle {
  const ringtone = startRingtone(options);
  const closeNotification = showIncomingNotification(title, body);
  let stopped = false;
  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      ringtone.stop();
      closeNotification();
    },
  };
}
