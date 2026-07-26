/**
 * Alerta de chamada recebida: toque (WebAudio) + notificação nativa.
 *
 * Implementação defensiva: qualquer API ausente (AudioContext, Notification)
 * degrada silenciosamente, pois o discador precisa funcionar em navegadores
 * restritos, SSR/JSDOM e contextos sem permissão de áudio/notificações.
 */

import { logger } from '@/lib/logger';

const log = logger.create('IncomingCallAlert');

/** Cadência clássica de telefonia BR: 1s de toque, 4s de silêncio. */
export const RING_ON_MS = 1000;
export const RING_CYCLE_MS = 5000;
const RING_FREQ_HZ = 440;
const RING_GAIN = 0.12;

interface AlertHandle {
  stop: () => void;
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

/** Inicia o toque em loop. Retorna um handle idempotente para parar. */
export function startRingtone(): AlertHandle {
  const Ctor = getAudioContextCtor();
  if (!Ctor) return { stop: () => undefined };

  let context: AudioContext | null = null;
  let interval: ReturnType<typeof setInterval> | null = null;
  let stopped = false;

  try {
    context = new Ctor();
  } catch (error) {
    log.warn('AudioContext indisponível para o toque', error);
    return { stop: () => undefined };
  }

  const beep = () => {
    if (stopped || !context || context.state === 'closed') return;
    try {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = RING_FREQ_HZ;
      gain.gain.setValueAtTime(RING_GAIN, context.currentTime);
      // Fade-out curto evita "click" audível ao final do toque.
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + RING_ON_MS / 1000);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + RING_ON_MS / 1000);
    } catch (error) {
      log.warn('Falha ao emitir toque', error);
    }
  };

  // Autoplay policy: se o contexto estiver suspenso, tenta retomar.
  if (context.state === 'suspended' && typeof context.resume === 'function') {
    void Promise.resolve(context.resume()).catch(() => undefined);
  }

  beep();
  interval = setInterval(beep, RING_CYCLE_MS);

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
export function startIncomingCallAlert(title: string, body: string): AlertHandle {
  const ringtone = startRingtone();
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
