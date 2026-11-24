import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioTestError, playTestTone, startMicLevel } from '../deviceTest';

type FakeTrack = { stop: ReturnType<typeof vi.fn> };

function fakeStream() {
  const tracks: FakeTrack[] = [{ stop: vi.fn() }];
  return {
    stream: { getTracks: () => tracks } as unknown as MediaStream,
    tracks,
  };
}

function installAudioContext() {
  const closed: boolean[] = [];
  const oscillators: Array<Record<string, unknown>> = [];

  class FakeAnalyser {
    fftSize = 1024;
    getByteTimeDomainData(buffer: Uint8Array) {
      buffer.fill(200);
    }
    connect() {}
  }

  class FakeAudioContext {
    currentTime = 0;
    destination = {};
    state = 'running';
    closed = closed;
    closedAt = -1;

    createMediaStreamSource() {
      return { connect: vi.fn(), disconnect: vi.fn() };
    }
    createAnalyser() {
      return new FakeAnalyser();
    }
    createOscillator() {
      const osc: Record<string, unknown> = {
        type: 'sine',
        frequency: { value: 0 },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(() => {
          queueMicrotask(() => (osc.onended as (() => void) | null)?.());
        }),
      };
      oscillators.push(osc);
      return osc;
    }
    createGain() {
      return {
        gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
      };
    }
    close() {
      this.closedAt = this.closed.push(true) - 1;
      return Promise.resolve();
    }
  }

  window.AudioContext = FakeAudioContext as unknown as typeof AudioContext;

  return { closed, oscillators };
}

function installGetUserMedia(result: 'grant' | { name: string }) {
  const getUserMedia =
    result === 'grant'
      ? vi.fn().mockResolvedValue(fakeStream().stream)
      : vi.fn().mockRejectedValue(Object.assign(new Error('denied'), { name: result.name }));
  Object.assign(navigator, { mediaDevices: { getUserMedia } });
  return getUserMedia;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('deviceTest', () => {
  it('explica a recusa de permissão e não vaza stream', async () => {
    installAudioContext();
    installGetUserMedia({ name: 'NotAllowedError' });

    await expect(startMicLevel(() => {})).rejects.toBeInstanceOf(AudioTestError);
    await expect(startMicLevel(() => {})).rejects.toThrow(/Permissão de microfone negada/);
  });

  it('mede o nível e libera o microfone ao parar', async () => {
    installAudioContext();
    const media = fakeStream();
    Object.assign(navigator, { mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(media.stream) } });
    const levels: number[] = [];

    const handle = await startMicLevel((level) => levels.push(level));
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    handle.stop();

    expect(media.tracks[0].stop).toHaveBeenCalledTimes(1);
    expect(levels.some((level) => level > 0)).toBe(true);
    expect(levels.at(-1)).toBe(0);
  });

  it('avisa quando não há microfone disponível', async () => {
    installAudioContext();
    installGetUserMedia({ name: 'NotFoundError' });

    await expect(startMicLevel(() => {})).rejects.toThrow(/Nenhum microfone encontrado/);
  });

  it('toca o tom de saída e fecha o contexto', async () => {
    const { closed, oscillators } = installAudioContext();

    await playTestTone(0);

    expect(oscillators).toHaveLength(1);
    expect(oscillators[0].start).toHaveBeenCalled();
    expect(oscillators[0].stop).toHaveBeenCalled();
    expect(closed).toHaveLength(1);
  });

  it('falha com mensagem clara sem Web Audio', async () => {
    installAudioContext();
    Object.assign(window, { AudioContext: undefined, webkitAudioContext: undefined });

    await expect(playTestTone()).rejects.toThrow(/não suporta reprodução de áudio/);
  });
});
