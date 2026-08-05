/**
 * Camada fina sobre a Web Speech Synthesis API para respostas faladas do
 * assistente. Toda a API é defensiva: navegadores sem suporte, vozes ainda
 * não carregadas ou erros de síntese nunca devem quebrar a UI.
 */

import type { VoiceOption } from './voice-preferences';

export interface SpeakOptions {
  /** Idioma BCP-47 (padrão pt-BR). */
  lang?: string;
  /** Velocidade da fala (0.5 – 2). */
  rate?: number;
  /** Identificador (voiceURI) da voz preferida; ausente = melhor voz do idioma. */
  voiceUri?: string | null;
  /** Chamado quando a fala termina, é cancelada ou falha. */
  onEnd?: () => void;
}

/** Indica se o navegador atual suporta síntese de voz. */
export function isSpeechSupported(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined';
  } catch {
    return false;
  }
}

function clampRate(rate: unknown): number {
  const value = typeof rate === 'number' && Number.isFinite(rate) ? rate : 1;
  return Math.min(2, Math.max(0.5, value));
}

/**
 * Lista as vozes disponíveis para um idioma, já reduzidas ao formato usado
 * pela UI. Sempre devolve array (vazio quando o navegador não expõe vozes,
 * o que é comum antes do evento `voiceschanged`).
 */
export function listVoices(lang = 'pt-BR'): VoiceOption[] {
  if (!isSpeechSupported()) return [];
  try {
    const voices = window.speechSynthesis.getVoices();
    if (!Array.isArray(voices)) return [];
    const prefix = lang.toLowerCase().slice(0, 2);
    return voices
      .filter((voice) => typeof voice?.voiceURI === 'string' && voice.lang?.toLowerCase().startsWith(prefix))
      .map((voice) => ({ uri: voice.voiceURI, name: voice.name || voice.voiceURI, lang: voice.lang || lang }));
  } catch {
    return [];
  }
}

/** Registra um listener para quando o navegador carregar as vozes. */
export function onVoicesChanged(handler: () => void): () => void {
  if (!isSpeechSupported()) return () => undefined;
  try {
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    return () => {
      try {
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
      } catch {
        // ignorado
      }
    };
  } catch {
    return () => undefined;
  }
}

/** Escolhe a voz preferida ou, na falta dela, a melhor voz do idioma. */
function pickVoice(lang: string, preferredUri?: string | null): SpeechSynthesisVoice | null {
  try {
    const voices = window.speechSynthesis.getVoices();
    if (!Array.isArray(voices) || voices.length === 0) return null;
    const target = lang.toLowerCase();
    const preferred = preferredUri ? voices.find((voice) => voice.voiceURI === preferredUri) : undefined;
    if (preferred) return preferred;
    return (
      voices.find((voice) => voice.lang?.toLowerCase() === target) ??
      voices.find((voice) => voice.lang?.toLowerCase().startsWith(target.slice(0, 2))) ??
      null
    );
  } catch {
    return null;
  }
}

/** Interrompe qualquer fala em andamento. */
export function cancelSpeech(): void {
  if (!isSpeechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // navegador pode lançar se a síntese não estiver pronta
  }
}

/**
 * Fala o texto informado. Retorna `false` quando não foi possível iniciar a
 * síntese — nesse caso `onEnd` é chamado imediatamente para que o chamador
 * possa reverter a fase visual de "falando".
 */
export function speak(text: string, options: SpeakOptions = {}): boolean {
  const content = typeof text === 'string' ? text.trim() : '';
  const finish = options.onEnd ?? (() => undefined);

  if (!content || !isSpeechSupported()) {
    finish();
    return false;
  }

  try {
    cancelSpeech();
    const lang = options.lang && options.lang.trim() ? options.lang : 'pt-BR';
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = lang;
    utterance.rate = clampRate(options.rate);
    const voice = pickVoice(lang, options.voiceUri ?? null);
    if (voice) utterance.voice = voice;

    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      finish();
    };
    utterance.onend = settle;
    utterance.onerror = settle;

    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    finish();
    return false;
  }
}
