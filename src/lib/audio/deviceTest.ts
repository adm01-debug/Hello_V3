/**
 * Testes de áudio do navegador usados em Configurações.
 * Tudo aqui é local: microfone via getUserMedia (com liberação obrigatória do stream)
 * e um tom curto na saída. Nada vai para o backend.
 */

export class AudioTestError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'AudioTestError';
  }
}

export interface MicTestHandle {
  stop: () => void;
}

type AudioContextCtor = typeof AudioContext;

function getAudioContextCtor(): AudioContextCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as Window & { webkitAudioContext?: AudioContextCtor };
  return window.AudioContext ?? w.webkitAudioContext;
}

export function describeMicError(error: unknown): string {
  const name = (error as { name?: string } | null)?.name;
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Permissão de microfone negada. Libere o microfone no navegador e tente de novo.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'Nenhum microfone encontrado. Conecte um dispositivo e tente de novo.';
    case 'NotReadableError':
      return 'O microfone está em uso por outro aplicativo.';
    default:
      return 'Não foi possível acessar o microfone.';
  }
}

/**
 * Abre o microfone e reporta o nível (0..1) a cada quadro.
 * Quem chama é obrigado a executar `stop()` — é o que devolve o microfone ao sistema.
 */
export async function startMicLevel(onLevel: (level: number) => void): Promise<MicTestHandle> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new AudioTestError(
      'Este navegador não expõe acesso ao microfone. Abra o sistema em HTTPS (ou localhost).',
    );
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    throw new AudioTestError(describeMicError(error), error);
  }

  const Ctor = getAudioContextCtor();
  if (!Ctor) {
    stream.getTracks().forEach((track) => track.stop());
    throw new AudioTestError('Este navegador não suporta análise de áudio.');
  }

  const context = new Ctor();
  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(analyser);
  const buffer = new Uint8Array(analyser.fftSize);
  let frame = 0;
  let stopped = false;

  const tick = () => {
    if (stopped) return;
    analyser.getByteTimeDomainData(buffer);
    let peak = 0;
    for (let i = 0; i < buffer.length; i += 1) {
      const deviation = Math.abs(buffer[i] - 128) / 128;
      if (deviation > peak) peak = deviation;
    }
    onLevel(Math.min(1, peak));
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(frame);
      source.disconnect();
      stream.getTracks().forEach((track) => track.stop());
      void context.close();
      onLevel(0);
    },
  };
}

/** Toca um tom curto (440 Hz) na saída de áudio padrão. */
export async function playTestTone(seconds = 0.8): Promise<void> {
  const Ctor = getAudioContextCtor();
  if (!Ctor) throw new AudioTestError('Este navegador não suporta reprodução de áudio.');

  const context = new Ctor();
  try {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 440;
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, context.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, context.currentTime + seconds);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + seconds);
    await new Promise<void>((resolve) => {
      oscillator.onended = () => resolve();
      // Alguns navegadores não disparam `ended` em contexto suspenso.
      setTimeout(resolve, (seconds + 0.3) * 1000);
    });
  } finally {
    void context.close();
  }
}
