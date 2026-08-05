import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const invokeMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

import { useCallScoring } from '../useCallScoring';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

const result = {
  score: 80,
  recommendation: 'high_priority',
  factors: ['good_hour'],
  dnc: false,
  within_hours: true,
  computed_at: '2026-01-01T00:00:00Z',
};

describe('useCallScoring', () => {
  beforeEach(() => vi.clearAllMocks());

  it('expõe o estado inicial', () => {
    const { result: hook } = renderHook(() => useCallScoring(), { wrapper });
    expect(hook.current.lastResult).toBeNull();
    expect(hook.current.isScoring).toBe(false);
    expect(typeof hook.current.score).toBe('function');
  });

  it('calcula score com sucesso', async () => {
    invokeMock.mockResolvedValue({ data: result, error: null });
    const { result: hook } = renderHook(() => useCallScoring(), { wrapper });
    await act(async () => {
      const r = await hook.current.score({ phone: '+5511999999999' });
      expect(r.score).toBe(80);
    });
    await waitFor(() => expect(hook.current.lastResult?.score).toBe(80));
    expect(invokeMock).toHaveBeenCalledWith('score-call-attempt', { body: { phone: '+5511999999999' } });
  });

  it('lança erro quando a edge function falha', async () => {
    invokeMock.mockResolvedValue({ data: null, error: new Error('boom') });
    const { result: hook } = renderHook(() => useCallScoring(), { wrapper });
    await expect(
      act(async () => {
        await hook.current.score({ phone: '+5511000000000', contact_id: 'c1', region_code: 'SP' });
      }),
    ).rejects.toThrow('boom');
  });
});
