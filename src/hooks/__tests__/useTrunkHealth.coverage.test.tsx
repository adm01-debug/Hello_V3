import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTrunkHealthHistory, useRunHealthCheck } from '../useTrunkHealth';

const fromMock = vi.fn();
const invokeMock = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...a: unknown[]) => fromMock(...a),
    functions: { invoke: (...a: unknown[]) => invokeMock(...a) },
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

describe('useTrunkHealth (coverage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [{ id: 'h1' }], error: null }),
    });
    invokeMock.mockResolvedValue({ data: { checked: 3 }, error: null });
  });

  it('loads health history for a trunk', async () => {
    const { result } = renderHook(() => useTrunkHealthHistory('t1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  it('is disabled without trunkId', async () => {
    const { result } = renderHook(() => useTrunkHealthHistory(null), { wrapper });
    // disabled -> stays pending/idle, never fetches
    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('history fetch error throws', async () => {
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: new Error('hist-err') }),
    });
    const { result } = renderHook(() => useTrunkHealthHistory('t1'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('runs health check successfully', async () => {
    const { result } = renderHook(() => useRunHealthCheck(), { wrapper });
    await act(async () => { await result.current.mutateAsync(); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('health check error path', async () => {
    invokeMock.mockResolvedValue({ data: null, error: new Error('hc-fail') });
    const { result } = renderHook(() => useRunHealthCheck(), { wrapper });
    await act(async () => { await result.current.mutateAsync().catch(() => {}); });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
