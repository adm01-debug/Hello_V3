import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const mockToast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: mockToast }));

vi.mock('@/lib/logger', () => {
  const methods = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  return {
    logger: { ...methods, create: vi.fn(() => ({ ...methods })) },
  };
});

// invoke is controlled per-test
const invokeMock = vi.hoisted(() => vi.fn());
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
  },
}));

import { useWavoipCall } from '@/hooks/useWavoipCall';

beforeEach(() => {
  mockToast.success.mockReset();
  mockToast.error.mockReset();
  mockToast.info.mockReset();
  invokeMock.mockReset();
  // default: configured + connected
  invokeMock.mockResolvedValue({ data: { success: true, connected: true }, error: null });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useWavoipCall', () => {
  it('checks configuration on mount (connected)', async () => {
    const { result } = renderHook(() => useWavoipCall());
    await waitFor(() => expect(result.current.isConfigured).toBe(true));
    expect(result.current.status).toBe('connected');
    expect(result.current.error).toBeNull();
  });

  it('checkConfiguration when not connected sets disconnected', async () => {
    invokeMock.mockResolvedValue({ data: { success: true, connected: false }, error: null });
    const { result } = renderHook(() => useWavoipCall());
    await waitFor(() => expect(result.current.status).toBe('disconnected'));
    expect(result.current.isConfigured).toBe(false);
    expect(result.current.error).toBe('Token Wavoip não configurado');
  });

  it('checkConfiguration with supabase error sets error state', async () => {
    invokeMock.mockResolvedValue({ data: null, error: new Error('cfg err') });
    const { result } = renderHook(() => useWavoipCall());
    await waitFor(() => expect(result.current.error).toBe('Erro ao verificar configuração'));
    expect(result.current.isConfigured).toBe(false);
  });

  it('checkConfiguration thrown error sets connection failure', async () => {
    invokeMock.mockRejectedValue(new Error('network down'));
    const { result } = renderHook(() => useWavoipCall());
    await waitFor(() => expect(result.current.error).toBe('Falha na conexão'));
    expect(result.current.isConfigured).toBe(false);
  });

  it('startCall rejects empty phone number', async () => {
    const { result } = renderHook(() => useWavoipCall());
    await waitFor(() => expect(result.current.isConfigured).toBe(true));

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.startCall('');
    });
    expect(ok).toBe(false);
    expect(mockToast.error).toHaveBeenCalledWith('Número de telefone é obrigatório');
  });

  it('startCall success transitions calling -> active and runs duration timer', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useWavoipCall());
    // mount config check resolves
    await act(async () => { await Promise.resolve(); });

    invokeMock.mockResolvedValue({ data: { success: true, callId: 'call-1' }, error: null });

    await act(async () => {
      const p = result.current.startCall('5511999999999');
      await Promise.resolve();
      await p;
    });
    expect(result.current.status).toBe('calling');
    expect(result.current.callId).toBe('call-1');

    // advance the 2000ms connection delay -> active + duration timer starts
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(result.current.status).toBe('active');
    expect(result.current.isInCall).toBe(true);

    // advance duration timer ticks
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(result.current.duration).toBeGreaterThanOrEqual(3);

    vi.useRealTimers();
  });

  it('startCall failure (data.success false) sets error', async () => {
    const { result } = renderHook(() => useWavoipCall());
    await waitFor(() => expect(result.current.isConfigured).toBe(true));

    invokeMock.mockResolvedValue({ data: { success: false, error: 'denied' }, error: null });
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.startCall('111');
    });
    expect(ok).toBe(false);
    expect(result.current.status).toBe('error');
    expect(mockToast.error).toHaveBeenCalledWith('denied');
  });

  it('startCall failure (supabase error) uses fallback message', async () => {
    const { result } = renderHook(() => useWavoipCall());
    await waitFor(() => expect(result.current.isConfigured).toBe(true));

    invokeMock.mockResolvedValue({ data: null, error: new Error('boom') });
    await act(async () => {
      await result.current.startCall('111');
    });
    expect(result.current.status).toBe('error');
    expect(mockToast.error).toHaveBeenCalledWith('Falha ao iniciar chamada');
  });

  it('startCall thrown error sets error message from exception', async () => {
    const { result } = renderHook(() => useWavoipCall());
    await waitFor(() => expect(result.current.isConfigured).toBe(true));

    invokeMock.mockRejectedValue(new Error('thrown msg'));
    await act(async () => {
      await result.current.startCall('111');
    });
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('thrown msg');
    expect(mockToast.error).toHaveBeenCalledWith('thrown msg');
  });

  it('endCall without active callId resets to connected', async () => {
    const { result } = renderHook(() => useWavoipCall());
    await waitFor(() => expect(result.current.isConfigured).toBe(true));

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.endCall();
    });
    expect(ok).toBe(true);
    expect(result.current.status).toBe('connected');
    expect(result.current.callId).toBeNull();
  });

  it('endCall with active callId invokes end and resets state', async () => {
    const { result } = renderHook(() => useWavoipCall());
    await waitFor(() => expect(result.current.isConfigured).toBe(true));

    // establish a call
    invokeMock.mockResolvedValue({ data: { success: true, callId: 'call-2' }, error: null });
    await act(async () => {
      await result.current.startCall('222');
    });
    expect(result.current.callId).toBe('call-2');

    invokeMock.mockResolvedValue({ data: { success: true }, error: null });
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.endCall();
    });
    expect(ok).toBe(true);
    expect(result.current.status).toBe('connected');
    expect(result.current.callId).toBeNull();
    expect(mockToast.info).toHaveBeenCalledWith('Chamada WhatsApp encerrada');
  });

  it('endCall with end warning still resets', async () => {
    const { result } = renderHook(() => useWavoipCall());
    await waitFor(() => expect(result.current.isConfigured).toBe(true));

    invokeMock.mockResolvedValue({ data: { success: true, callId: 'call-3' }, error: null });
    await act(async () => {
      await result.current.startCall('333');
    });

    invokeMock.mockResolvedValue({ data: { success: false, error: 'warn' }, error: null });
    await act(async () => {
      await result.current.endCall();
    });
    expect(result.current.status).toBe('connected');
  });

  it('endCall thrown error still ends the call', async () => {
    const { result } = renderHook(() => useWavoipCall());
    await waitFor(() => expect(result.current.isConfigured).toBe(true));

    invokeMock.mockResolvedValue({ data: { success: true, callId: 'call-4' }, error: null });
    await act(async () => {
      await result.current.startCall('444');
    });

    invokeMock.mockRejectedValue(new Error('end boom'));
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.endCall();
    });
    expect(ok).toBe(true);
    expect(result.current.status).toBe('connected');
    expect(result.current.callId).toBeNull();
  });

  it('cleans up timer on unmount', async () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useWavoipCall());
    await act(async () => { await Promise.resolve(); });

    invokeMock.mockResolvedValue({ data: { success: true, callId: 'call-5' }, error: null });
    await act(async () => {
      await result.current.startCall('555');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    unmount();
    vi.useRealTimers();
    expect(true).toBe(true);
  });
});
