import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useVoiceCommand } from '../useVoiceCommand';

const invokeMock = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...a: unknown[]) => invokeMock(...a) } },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({ logger: { create: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }) } }));

class MockFileReader {
  result: string | null = null;
  onloadend: (() => void) | null = null;
  readAsDataURL() {
    this.result = 'data:audio/webm;base64,QUJD';
    setTimeout(() => this.onloadend?.(), 0);
  }
}

class MockMediaRecorder {
  state = 'inactive';
  ondataavailable: ((e: { data: { size: number } }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(public stream: unknown) {}
  start() { this.state = 'recording'; }
  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: { size: 5 } });
    this.onstop?.();
  }
}

describe('useVoiceCommand (coverage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as unknown as { FileReader: unknown }).FileReader = MockFileReader;
    (globalThis as unknown as { MediaRecorder: unknown }).MediaRecorder = MockMediaRecorder;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }) },
    });
    invokeMock.mockResolvedValue({ data: { text: 'call john', confidence: 0.9, action: 'dial' }, error: null });
  });

  it('processes audio successfully via start/stop', async () => {
    const { result } = renderHook(() => useVoiceCommand());
    await act(async () => { await result.current.startListening(); });
    expect(result.current.isListening).toBe(true);
    await act(async () => { result.current.stopListening(); });
    await waitFor(() => expect(result.current.lastCommand?.command).toBe('call john'));
    expect(result.current.isProcessing).toBe(false);
  });

  it('handles transcribe error', async () => {
    invokeMock.mockResolvedValueOnce({ data: null, error: new Error('transcribe') });
    const { result } = renderHook(() => useVoiceCommand());
    await act(async () => { await result.current.startListening(); });
    await act(async () => { result.current.stopListening(); });
    await waitFor(() => expect(result.current.isProcessing).toBe(false));
    expect(result.current.lastCommand).toBeNull();
  });

  it('handles command error but keeps transcription', async () => {
    invokeMock
      .mockResolvedValueOnce({ data: { text: 'hello', confidence: 0.5 }, error: null })
      .mockResolvedValueOnce({ data: null, error: new Error('cmd') });
    const { result } = renderHook(() => useVoiceCommand());
    await act(async () => { await result.current.startListening(); });
    await act(async () => { result.current.stopListening(); });
    await waitFor(() => expect(result.current.lastCommand?.command).toBe('hello'));
  });

  it('handles getUserMedia failure', async () => {
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('mic'));
    const { result } = renderHook(() => useVoiceCommand());
    await act(async () => { await result.current.startListening(); });
    expect(result.current.isListening).toBe(false);
  });

  it('stopListening is a no-op when not recording', () => {
    const { result } = renderHook(() => useVoiceCommand());
    act(() => result.current.stopListening());
    expect(result.current.isListening).toBe(false);
  });
});
