/**
 * Extração leve de features acústicas do navegador para biometria de voz.
 * Sem ML pesado: estatísticas espectrais via WebAudio AnalyserNode.
 * O vetor resultante é de dimensão fixa (64) — compatível entre amostras.
 *
 * NÃO é state-of-the-art (Pindrop usa modelos muito mais sofisticados),
 * mas serve como linha de base honesta sem custo de inferência.
 */

const VECTOR_DIM = 64;
const FFT_SIZE = 1024;
const SAMPLE_DURATION_MS = 4000;

export interface ExtractedFeatures {
  embedding: number[];
  summary: {
    mean_pitch: number;
    pitch_variance: number;
    energy: number;
    sample_rate: number;
    duration_seconds: number;
  };
}

/** Captura ~4s de microfone e devolve o embedding. */
export async function captureVoiceSample(durationMs = SAMPLE_DURATION_MS): Promise<ExtractedFeatures> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  try {
    return await analyzeStream(stream, durationMs);
  } finally {
    stream.getTracks().forEach((t) => t.stop());
  }
}

async function analyzeStream(stream: MediaStream, durationMs: number): Promise<ExtractedFeatures> {
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = FFT_SIZE;
  source.connect(analyser);

  const freqBuffer = new Uint8Array(analyser.frequencyBinCount);
  const timeBuffer = new Uint8Array(analyser.fftSize);

  const accum = new Float32Array(VECTOR_DIM);
  const energySamples: number[] = [];
  const dominantBins: number[] = [];
  let frames = 0;

  const start = performance.now();
  await new Promise<void>((resolve) => {
    const tick = () => {
      analyser.getByteFrequencyData(freqBuffer);
      analyser.getByteTimeDomainData(timeBuffer);

      // Acumula em buckets de tamanho VECTOR_DIM
      const binsPerBucket = Math.floor(freqBuffer.length / VECTOR_DIM);
      for (let i = 0; i < VECTOR_DIM; i++) {
        let sum = 0;
        for (let j = 0; j < binsPerBucket; j++) {
          sum += freqBuffer[i * binsPerBucket + j] ?? 0;
        }
        accum[i] += sum / binsPerBucket;
      }

      // Energia RMS no domínio do tempo
      let sumSq = 0;
      for (let i = 0; i < timeBuffer.length; i++) {
        const v = (timeBuffer[i] - 128) / 128;
        sumSq += v * v;
      }
      energySamples.push(Math.sqrt(sumSq / timeBuffer.length));

      // Bin dominante (pitch proxy)
      let maxIdx = 0;
      let maxVal = 0;
      for (let i = 1; i < freqBuffer.length / 2; i++) {
        if (freqBuffer[i] > maxVal) {
          maxVal = freqBuffer[i];
          maxIdx = i;
        }
      }
      dominantBins.push(maxIdx);

      frames++;
      if (performance.now() - start < durationMs) {
        requestAnimationFrame(tick);
      } else {
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });

  await ctx.close();

  // Normaliza
  const embedding = Array.from(accum, (v) => (frames > 0 ? v / frames / 255 : 0));

  const meanPitch = dominantBins.reduce((a, b) => a + b, 0) / Math.max(1, dominantBins.length);
  const pitchVar =
    dominantBins.reduce((a, b) => a + (b - meanPitch) ** 2, 0) / Math.max(1, dominantBins.length);
  const energy = energySamples.reduce((a, b) => a + b, 0) / Math.max(1, energySamples.length);

  return {
    embedding,
    summary: {
      mean_pitch: Math.round(meanPitch * 100) / 100,
      pitch_variance: Math.round(pitchVar * 100) / 100,
      energy: Math.round(energy * 10000) / 10000,
      sample_rate: ctx.sampleRate,
      duration_seconds: durationMs / 1000,
    },
  };
}

/** Validação rápida do vetor (consistência entre captura e backend). */
export function isValidEmbedding(emb: unknown): emb is number[] {
  return Array.isArray(emb) && emb.length === VECTOR_DIM && emb.every((v) => typeof v === 'number' && !isNaN(v));
}

export const VOICE_VECTOR_DIM = VECTOR_DIM;
