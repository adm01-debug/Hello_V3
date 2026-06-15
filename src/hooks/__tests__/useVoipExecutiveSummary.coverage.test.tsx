import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVoipExecutiveSummary } from '../useVoipExecutiveSummary';

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

describe('useVoipExecutiveSummary (coverage)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches summary with default period', async () => {
    invokeMock.mockResolvedValue({ data: { period: 'week', health_score: 90 }, error: null });
    const { result } = renderHook(() => useVoipExecutiveSummary(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.health_score).toBe(90);
  });

  it('fetches summary with explicit day period', async () => {
    invokeMock.mockResolvedValue({ data: { period: 'day', health_score: 50 }, error: null });
    const { result } = renderHook(() => useVoipExecutiveSummary('day'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('throws on invoke error', async () => {
    invokeMock.mockResolvedValue({ data: null, error: Object.assign(new Error('sum-fail'), { status: 404 }) });
    const { result } = renderHook(() => useVoipExecutiveSummary('month'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
