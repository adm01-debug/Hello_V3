import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const invokeMock = vi.fn();
const deleteEqMock = vi.fn();
const orderMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: (...a: unknown[]) => orderMock(...a),
      delete: vi.fn(() => ({ eq: (...a: unknown[]) => deleteEqMock(...a) })),
    })),
    functions: { invoke: (...a: unknown[]) => invokeMock(...a) },
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    create: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  },
}));

vi.mock('@/lib/tracing', () => ({
  traceHeaders: () => ({}),
  withTrace: async (_op: string, fn: () => unknown) => fn(),
}));

const captureVoiceSampleMock = vi.fn();
vi.mock('@/lib/voice-biometrics', () => ({
  captureVoiceSample: (...a: unknown[]) => captureVoiceSampleMock(...a),
}));

import {
  useVoicePrints,
  useFraudSignals,
  useRedactCall,
  useLiveVoiceVerification,
} from '@/hooks/useVoiceBiometrics';
import { toast } from 'sonner';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
  orderMock.mockResolvedValue({
    data: [
      { id: 'vp1', user_id: 'u1', label: 'primary', sample_count: 3, confidence_baseline: 0.9, enrolled_at: '2024-01-01', last_verified_at: null, is_active: true, feature_summary: {} },
    ],
    error: null,
  });
  deleteEqMock.mockResolvedValue({ error: null });
  invokeMock.mockResolvedValue({ data: { ok: true }, error: null });
  captureVoiceSampleMock.mockResolvedValue({ embedding: [1, 2, 3], summary: { mean_pitch: 1 } });
});

describe('useVoicePrints', () => {
  it('loads voice prints list', async () => {
    const { result } = renderHook(() => useVoicePrints(), { wrapper });
    await waitFor(() => expect(result.current.voicePrints.length).toBe(1));
    expect(result.current.isLoading).toBe(false);
  });

  it('enrolls successfully', async () => {
    invokeMock.mockResolvedValue({ data: { id: 'new' }, error: null });
    const { result } = renderHook(() => useVoicePrints(), { wrapper });
    await waitFor(() => expect(result.current.voicePrints.length).toBe(1));
    act(() => { result.current.enroll({ samples: 2 }); });
    await waitFor(() => expect(invokeMock).toHaveBeenCalledWith('enroll-voice', expect.anything()));
    expect(captureVoiceSampleMock).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it('enroll error path triggers toast.error', async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: 'boom' } });
    const { result } = renderHook(() => useVoicePrints(), { wrapper });
    await waitFor(() => expect(result.current.voicePrints.length).toBe(1));
    act(() => { result.current.enroll({}); });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Falha no enrolamento de voz'));
  });

  it('verifies successfully', async () => {
    invokeMock.mockResolvedValue({ data: { enrolled: true, match: true, confidence: 88 }, error: null });
    const { result } = renderHook(() => useVoicePrints(), { wrapper });
    await waitFor(() => expect(result.current.voicePrints.length).toBe(1));
    let res: unknown;
    await act(async () => { res = await result.current.verify({ callSessionId: 'cs1' }); });
    expect(invokeMock).toHaveBeenCalledWith('verify-voice', expect.anything());
    expect(res).toMatchObject({ match: true });
  });

  it('verify error path triggers toast.error', async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: 'no' } });
    const { result } = renderHook(() => useVoicePrints(), { wrapper });
    await waitFor(() => expect(result.current.voicePrints.length).toBe(1));
    await act(async () => {
      try { await result.current.verify({}); } catch { /* expected */ }
    });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Falha na verificação'));
  });

  it('removes a voice print', async () => {
    const { result } = renderHook(() => useVoicePrints(), { wrapper });
    await waitFor(() => expect(result.current.voicePrints.length).toBe(1));
    act(() => { result.current.remove('vp1'); });
    await waitFor(() => expect(deleteEqMock).toHaveBeenCalledWith('id', 'vp1'));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Voice print removida'));
  });
});

describe('useFraudSignals', () => {
  it('loads signals without filters', async () => {
    const limitMock = vi.fn().mockResolvedValue({ data: [{ id: 'f1' }], error: null });
    const { supabase } = await import('@/integrations/supabase/client');
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: limitMock,
    } as never);
    const { result } = renderHook(() => useFraudSignals(), { wrapper });
    await waitFor(() => expect(result.current.data?.length).toBe(1));
  });

  it('applies severity and status filters', async () => {
    const eqMock = vi.fn().mockReturnThis();
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      eq: eqMock,
      then: (cb: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(cb),
    };
    const { supabase } = await import('@/integrations/supabase/client');
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(chain as never);
    const { result } = renderHook(
      () => useFraudSignals({ severity: 'high', status: 'open', limit: 10 }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(eqMock).toHaveBeenCalledWith('severity', 'high');
    expect(eqMock).toHaveBeenCalledWith('status', 'open');
  });
});

describe('useRedactCall', () => {
  it('redacts successfully', async () => {
    invokeMock.mockResolvedValue({ data: { matches: 5, patterns: {}, segments_count: 3 }, error: null });
    const { result } = renderHook(() => useRedactCall(), { wrapper });
    await act(async () => { await result.current.mutateAsync('cs1'); });
    expect(invokeMock).toHaveBeenCalledWith('redact-sensitive-audio', expect.anything());
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it('redact error path triggers toast.error', async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: 'fail' } });
    const { result } = renderHook(() => useRedactCall(), { wrapper });
    await act(async () => {
      try { await result.current.mutateAsync('cs1'); } catch { /* expected */ }
    });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Falha ao redatar transcrição'));
  });
});

describe('useLiveVoiceVerification', () => {
  it('returns null when no callSessionId', async () => {
    const { result } = renderHook(() => useLiveVoiceVerification(), { wrapper });
    let r: unknown;
    await act(async () => { r = await result.current.run(); });
    expect(r).toBeNull();
  });

  it('runs verification and warns when not matched', async () => {
    invokeMock.mockResolvedValue({ data: { enrolled: true, match: false }, error: null });
    const { result } = renderHook(() => useLiveVoiceVerification('cs1'), { wrapper });
    await act(async () => { await result.current.run(); });
    await waitFor(() => expect(result.current.lastVerdict).toMatchObject({ match: false }));
    expect(toast.warning).toHaveBeenCalled();
  });

  it('runs verification and shows success when matched', async () => {
    invokeMock.mockResolvedValue({ data: { enrolled: true, match: true, confidence: 90 }, error: null });
    const { result } = renderHook(() => useLiveVoiceVerification('cs1'), { wrapper });
    await act(async () => { await result.current.run(); });
    await waitFor(() => expect(result.current.lastVerdict).toMatchObject({ match: true }));
    expect(toast.success).toHaveBeenCalled();
  });
});
