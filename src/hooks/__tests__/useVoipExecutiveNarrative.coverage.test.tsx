import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVoipExecutiveNarrative } from '../useVoipExecutiveNarrative';

const invokeMock = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...a: unknown[]) => invokeMock(...a) } },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({ logger: { create: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }) } }));
vi.mock('@/lib/tracing', () => ({
  traceHeaders: () => ({ 'x-trace': '1' }),
  withTrace: (_n: string, fn: () => unknown) => fn(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

describe('useVoipExecutiveNarrative (coverage)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is disabled by default and does not fetch', async () => {
    invokeMock.mockResolvedValue({ data: { summary: 's' }, error: null });
    const { result } = renderHook(() => useVoipExecutiveNarrative('week'), { wrapper });
    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('fetches when enabled (week)', async () => {
    invokeMock.mockResolvedValue({ data: { summary: 'ok', period: 'week' }, error: null });
    const { result } = renderHook(() => useVoipExecutiveNarrative('week', true), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invokeMock).toHaveBeenCalledWith('voip-executive-narrative', { headers: { 'x-trace': '1' }, body: { period: 'week' } });
  });

  it('fetches with month period', async () => {
    invokeMock.mockResolvedValue({ data: { summary: 'ok', period: 'month' }, error: null });
    const { result } = renderHook(() => useVoipExecutiveNarrative('month', true), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('throws on invoke error', async () => {
    invokeMock.mockResolvedValue({ data: null, error: Object.assign(new Error('narr-fail'), { status: 404 }) });
    const { result } = renderHook(() => useVoipExecutiveNarrative('week', true), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
