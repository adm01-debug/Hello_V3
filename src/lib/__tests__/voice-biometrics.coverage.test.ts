import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  captureVoiceSample,
  isValidEmbedding,
  VOICE_VECTOR_DIM,
  type ExtractedFeatures,
} from '@/lib/voice-biometrics';

// ── WebAudio / mediaDevices fakes ──────────────────────────────────────────
interface FakeTrack {
  stop: () => void;
}

class FakeAnalyser {
  fftSize = 0;
  get frequencyBinCount(): number {
    return this.fftSize / 2;
  }
  getByteFrequencyData(buf: Uint8Array): void {
    for (let i = 0; i < buf.length; i++) buf[i] = (i * 7) % 256;
  }
  getByteTimeDomainData(buf: Uint8Array): void {
    for (let i = 0; i < buf.length; i++) buf[i] = 128 + ((i % 16) - 8);
  }
}

class FakeAudioContext {
  sampleRate = 48000;
  closed = false;
  createMediaStreamSource() {
    return { connect: vi.fn() };
  }
  createAnalyser() {
    return new FakeAnalyser();
  }
  async close(): Promise<void> {
    this.closed = true;
  }
}

const stopSpy = vi.fn();

function installAudioMocks() {
  (globalThis as unknown as { AudioContext: unknown }).AudioContext = FakeAudioContext;
  const track: FakeTrack = { stop: stopSpy };
  const stream = { getTracks: () => [track] } as unknown as MediaStream;
  (globalThis as unknown as { navigator: { mediaDevices: unknown } }).navigator = {
    ...(globalThis.navigator ?? {}),
    mediaDevices: {
      getUserMedia: vi.fn().mockResolvedValue(stream),
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Deterministic timing: advance performance.now so the rAF loop terminates.
  let t = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => {
    const cur = t;
    t += 50;
    return cur;
  });
  // requestAnimationFrame invokes synchronously-ish via microtask.
  (globalThis as unknown as { requestAnimationFrame: (cb: FrameRequestCallback) => number }).requestAnimationFrame =
    (cb: FrameRequestCallback): number => {
      Promise.resolve().then(() => cb(performance.now()));
      return 0;
    };
  installAudioMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('voice-biometrics: isValidEmbedding', () => {
  it('accepts an array of correct dimension with finite numbers', () => {
    const emb = new Array(VOICE_VECTOR_DIM).fill(0.5);
    expect(isValidEmbedding(emb)).toBe(true);
  });

  it('rejects non-arrays', () => {
    expect(isValidEmbedding(null)).toBe(false);
    expect(isValidEmbedding('not-array')).toBe(false);
    expect(isValidEmbedding({ length: VOICE_VECTOR_DIM })).toBe(false);
  });

  it('rejects wrong-length arrays', () => {
    expect(isValidEmbedding([1, 2, 3])).toBe(false);
    expect(isValidEmbedding(new Array(VOICE_VECTOR_DIM + 1).fill(0))).toBe(false);
  });

  it('rejects arrays containing NaN or non-numbers', () => {
    const withNaN = new Array(VOICE_VECTOR_DIM).fill(0);
    withNaN[3] = NaN;
    expect(isValidEmbedding(withNaN)).toBe(false);

    const withString = new Array(VOICE_VECTOR_DIM).fill(0) as unknown[];
    withString[5] = 'x';
    expect(isValidEmbedding(withString)).toBe(false);
  });

  it('exports the vector dimension constant', () => {
    expect(VOICE_VECTOR_DIM).toBe(64);
  });
});

describe('voice-biometrics: captureVoiceSample', () => {
  it('captures a sample and returns a valid embedding + summary', async () => {
    const features: ExtractedFeatures = await captureVoiceSample(120);

    expect(isValidEmbedding(features.embedding)).toBe(true);
    expect(features.embedding).toHaveLength(VOICE_VECTOR_DIM);
    expect(features.summary.sample_rate).toBe(48000);
    expect(features.summary.duration_seconds).toBeCloseTo(0.12);
    expect(typeof features.summary.mean_pitch).toBe('number');
    expect(typeof features.summary.pitch_variance).toBe('number');
    expect(typeof features.summary.energy).toBe('number');
    expect(features.summary.energy).toBeGreaterThanOrEqual(0);
  });

  it('stops all microphone tracks when finished', async () => {
    await captureVoiceSample(120);
    expect(stopSpy).toHaveBeenCalledTimes(1);
  });

  it('uses the default duration when no argument is given', async () => {
    const features = await captureVoiceSample();
    expect(features.summary.duration_seconds).toBe(4);
  });

  it('stops tracks even if analysis throws', async () => {
    (globalThis as unknown as { AudioContext: unknown }).AudioContext = class {
      createMediaStreamSource() {
        throw new Error('boom');
      }
    };
    await expect(captureVoiceSample(50)).rejects.toThrow('boom');
    expect(stopSpy).toHaveBeenCalledTimes(1);
  });
});
