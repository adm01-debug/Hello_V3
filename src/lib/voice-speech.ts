/**
 * Camada fina sobre a Web Speech Synthesis API para respostas faladas do
 * assistente. Toda a API é defensiva: navegadores sem suporte, vozes ainda
 * não carregadas ou erros de síntese nunca devem quebrar a UI.
 */

export interface SpeakOptions {
  /** Idioma BCP-47 (padrão pt-BR). */
  lang?: string;
  /** Velocidade da fala (0.5 – 2). */
  rate?: number;
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

/** Escolhe a melhor voz disponível para o idioma solicitado. */
function pickVoice(lang: string): SpeechSynthesisVoice | null {
  try {
    const voices = window.speechSynthesis.getVoices();
    if (!Array.isArray(voices) || voices.length === 0) return null;
    const target = lang.toLowerCase();
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
    const voice = pickVoice(lang);
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
