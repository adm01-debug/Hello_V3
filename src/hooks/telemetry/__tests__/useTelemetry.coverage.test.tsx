import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { Metric } from 'web-vitals';

const insertMock = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: (...args: unknown[]) => insertMock(...args),
    })),
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

// Capture registered web-vitals callbacks so we can invoke them in tests
const registered: Array<(metric: Metric) => void> = [];
const register = (cb: (metric: Metric) => void) => { registered.push(cb); };
vi.mock('web-vitals', () => ({
  onCLS: (cb: (metric: Metric) => void) => register(cb),
  onINP: (cb: (metric: Metric) => void) => register(cb),
  onLCP: (cb: (metric: Metric) => void) => register(cb),
  onFCP: (cb: (metric: Metric) => void) => register(cb),
  onTTFB: (cb: (metric: Metric) => void) => register(cb),
}));

const mockUser: { user: { id: string } | null } = { user: { id: 'u1' } };
vi.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => mockUser,
}));

import { useTelemetry } from '../useTelemetry';

const makeMetric = (): Metric => ({
  name: 'LCP',
  value: 1234,
  rating: 'good',
  navigationType: 'navigate',
  delta: 1234,
  id: 'm1',
  entries: [],
} as unknown as Metric);

describe('useTelemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registered.length = 0;
    mockUser.user = { id: 'u1' };
    insertMock.mockResolvedValue({ error: null });
  });

  it('registra observadores de web-vitals quando há usuário', () => {
    renderHook(() => useTelemetry());
    expect(registered.length).toBe(5);
  });

  it('não registra quando não há usuário', () => {
    mockUser.user = null;
    renderHook(() => useTelemetry());
    expect(registered.length).toBe(0);
  });

  it('envia métrica ao supabase (sucesso)', async () => {
    renderHook(() => useTelemetry());
    await registered[0](makeMetric());
    await waitFor(() => expect(insertMock).toHaveBeenCalledTimes(1));
    const payload = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.user_id).toBe('u1');
    expect(payload.metric_name).toBe('LCP');
    expect(payload.metric_value).toBe(1234);
  });

  it('lida com erro retornado pelo supabase', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    insertMock.mockResolvedValueOnce({ error: { message: 'boom' } });
    renderHook(() => useTelemetry());
    await registered[1](makeMetric());
    await waitFor(() => expect(warnSpy).toHaveBeenCalled());
    warnSpy.mockRestore();
  });

  it('lida com exceção lançada pelo insert', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    insertMock.mockRejectedValueOnce(new Error('network'));
    renderHook(() => useTelemetry());
    await registered[2](makeMetric());
    await waitFor(() => expect(errSpy).toHaveBeenCalled());
    errSpy.mockRestore();
  });
});
