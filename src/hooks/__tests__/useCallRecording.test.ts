import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const upload = vi.fn();
const insert = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: { from: () => ({ upload }) },
    from: () => ({ insert }),
  },
}));

import { useCallRecording } from '../useCallRecording';

class FakeMediaRecorder {
  static instances: FakeMediaRecorder[] = [];
  state = 'inactive';
  ondataavailable: ((e: { data: { size: number } }) => void) | null = null;
  onstop: (() => void) | null = null;
  stream = { getTracks: () => [{ stop: vi.fn() }] };
  constructor(public streamArg: unknown) { FakeMediaRecorder.instances.push(this); }
  start() { this.state = 'recording'; }
  stop() { this.state = 'inactive'; this.ondataavailable?.({ data: { size: 42 } }); this.onstop?.(); }
}

describe('useCallRecording', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    FakeMediaRecorder.instances = [];
    Object.defineProperty(globalThis.navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn(() => Promise.resolve({ getTracks: () => [{ stop: vi.fn() }] })) },
    });
    (globalThis as unknown as { MediaRecorder: unknown }).MediaRecorder = FakeMediaRecorder;
    upload.mockResolvedValue({ error: null });
    insert.mockResolvedValue({ error: null });
  });

  it('inicia a captura e persiste o audio ao parar', async () => {
    const { result } = renderHook(() => useCallRecording());

    let started: boolean | undefined;
    await act(async () => { started = await result.current.startRecording(); });
    expect(started).toBe(true);
    expect(result.current.isRecording).toBe(true);

    let saved: string | null = null;
    await act(async () => { saved = await result.current.stopAndSaveRecording({ callSessionId: 'sess-1' }); });

    expect(saved).toContain('recordings/');
    expect(upload).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ call_session_id: 'sess-1' }));
    expect(result.current.isRecording).toBe(false);
  });

  it('devolve null e nao grava quando o microfone e negado', async () => {
    Object.defineProperty(globalThis.navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn(() => Promise.reject(new Error('denied'))) },
    });
    const { result } = renderHook(() => useCallRecording());
    let started: boolean | undefined;
    await act(async () => { started = await result.current.startRecording(); });
    expect(started).toBe(false);
    expect(result.current.isRecording).toBe(false);
    expect(upload).not.toHaveBeenCalled();
  });

  it('devolve null quando o audio sobe mas a gravacao nao e registrada no banco', async () => {
    insert.mockResolvedValue({ error: { message: 'new row violates row-level security policy' } });
    const { result } = renderHook(() => useCallRecording());

    await act(async () => { await result.current.startRecording(); });
    let saved: string | null = 'pendente';
    await act(async () => { saved = await result.current.stopAndSaveRecording({ callSessionId: 'sess-1' }); });

    // O audio existe no storage, mas sem a linha em call_recordings a tela nao
    // pode anunciar sucesso.
    expect(upload).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledTimes(1);
    expect(saved).toBeNull();
  });
});
