import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLiveTranscription } from '../useLiveTranscription';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn(), create: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() }) },
}));

// ----- MediaRecorder mock capturing latest instance -----
type RecorderEvents = {
  ondataavailable: ((e: { data: Blob }) => void) | null;
  onstop: (() => void) | null;
};

class MockMediaRecorder implements RecorderEvents {
  static isTypeSupported = vi.fn().mockReturnValue(true);
  static latest: MockMediaRecorder | null = null;

  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  ondataavailable: RecorderEvents['ondataavailable'] = null;
  onstop: RecorderEvents['onstop'] = null;

  constructor(_stream: MediaStream, _opts?: MediaRecorderOptions) {
    MockMediaRecorder.latest = this;
  }
  start() { this.state = 'recording'; }
  stop() {
    this.state = 'inactive';
    this.onstop?.();
  }
  emitData(blob: Blob) { this.ondataavailable?.({ data: blob }); }
}

// ----- MediaStream/track mock -----
function makeStream(): MediaStream {
  const track = { stop: vi.fn() } as unknown as MediaStreamTrack;
  return { getTracks: () => [track] } as unknown as MediaStream;
}

const getUserMediaMock = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  MockMediaRecorder.latest = null;
  MockMediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true);

  // @ts-expect-error install global mocks
  globalThis.MediaRecorder = MockMediaRecorder;

  Object.defineProperty(globalThis.navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: getUserMediaMock },
  });

  getUserMediaMock.mockReset();
  getUserMediaMock.mockResolvedValue(makeStream());

  globalThis.fetch = vi.fn() as unknown as typeof fetch;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useLiveTranscription', () => {
  it('estado inicial é seguro', () => {
    const { result } = renderHook(() => useLiveTranscription({}));
    expect(result.current.isRecording).toBe(false);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.transcripts).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.speakerStats).toEqual({ agent: 0, customer: 0 });
  });

  it('define erro quando getUserMedia falha', async () => {
    getUserMediaMock.mockRejectedValueOnce(new Error('denied'));
    const { result } = renderHook(() => useLiveTranscription({}));

    await act(async () => { await result.current.startRecording(); });

    expect(result.current.error).toMatch(/microfone/i);
    expect(result.current.isRecording).toBe(false);
  });

  it('startRecording ativa gravação e stopRecording faz cleanup', async () => {
    const { result } = renderHook(() => useLiveTranscription({}));

    await act(async () => { await result.current.startRecording(); });
    expect(result.current.isRecording).toBe(true);
    expect(MockMediaRecorder.latest?.state).toBe('recording');

    act(() => { result.current.stopRecording(); });
    expect(result.current.isRecording).toBe(false);
  });

  it('processa segmentos retornados pela edge function', async () => {
    const onTranscript = vi.fn();
    const onNewText = vi.fn();

    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        segments: [
          { speaker: 'spk_A', text: 'Olá', start: 0, end: 1 },
          { speaker: 'spk_B', text: 'Oi', start: 1, end: 2 },
        ],
      }),
    });

    const { result } = renderHook(() => useLiveTranscription({ onTranscript, onNewText }));
    await act(async () => { await result.current.startRecording(); });

    // Simula chunk grande o suficiente para não ser descartado
    const bigPayload = new Uint8Array(2000);
    act(() => {
      MockMediaRecorder.latest!.emitData(new Blob([bigPayload], { type: 'audio/webm' }));
      MockMediaRecorder.latest!.stop();
    });

    await waitFor(() => expect(result.current.transcripts.length).toBe(2));
    expect(result.current.transcripts[0].speaker).toBe('agent');
    expect(result.current.transcripts[1].speaker).toBe('customer');
    expect(result.current.speakerStats).toEqual({ agent: 1, customer: 1 });
    expect(onTranscript).toHaveBeenCalledTimes(2);
    expect(onNewText).toHaveBeenCalledWith('Olá');
  });

  it('define erro quando fetch falha', async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'falha' }),
    });

    const { result } = renderHook(() => useLiveTranscription({}));
    await act(async () => { await result.current.startRecording(); });

    act(() => {
      MockMediaRecorder.latest!.emitData(new Blob([new Uint8Array(2000)], { type: 'audio/webm' }));
      MockMediaRecorder.latest!.stop();
    });

    await waitFor(() => expect(result.current.error).toBe('falha'));
  });

  it('stopRecording é idempotente quando nada foi iniciado', () => {
    const { result } = renderHook(() => useLiveTranscription({}));
    expect(() => act(() => result.current.stopRecording())).not.toThrow();
    expect(result.current.isRecording).toBe(false);
  });
});
