import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useDashboardStats,
  useAgentsListData,
  useRecentCallsData,
  useCallVolumeData,
  useQueueStatsData,
} from '../useDashboardData';

const rpc = vi.fn();
const order = vi.fn();
const limit = vi.fn();
const select = vi.fn(() => ({ order }));
const from = vi.fn(() => ({ select }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...a: unknown[]) => (rpc as (...args: unknown[]) => unknown)(...a),
    from: (...a: unknown[]) => (from as (...args: unknown[]) => unknown)(...a),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  order.mockReturnValue({ limit });
});

describe('useDashboardData', () => {
  it('useDashboardStats success', async () => {
    rpc.mockResolvedValue({ data: { totalCallsToday: 5 }, error: null });
    const { result } = renderHook(() => useDashboardStats(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.totalCallsToday).toBe(5);
    expect(rpc).toHaveBeenCalledWith('get_dashboard_stats');
  });

  it('useDashboardStats error', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } });
    const { result } = renderHook(() => useDashboardStats(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('useAgentsListData success returns data', async () => {
    rpc.mockResolvedValue({ data: [{ id: 'a1', name: 'X', status: 'online', avatar_url: null, extension: '1' }], error: null });
    const { result } = renderHook(() => useAgentsListData(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBe(1);
  });

  it('useAgentsListData falls back to empty array when data null', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => useAgentsListData(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('useAgentsListData error', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'no agents' } });
    const { result } = renderHook(() => useAgentsListData(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('useRecentCallsData success', async () => {
    limit.mockResolvedValue({ data: [{ id: 'c1', started_at: '2024-01-01' }], error: null });
    const { result } = renderHook(() => useRecentCallsData(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBe(1);
    expect(from).toHaveBeenCalledWith('call_sessions');
  });

  it('useRecentCallsData null data -> empty array', async () => {
    limit.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => useRecentCallsData(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('useRecentCallsData error', async () => {
    limit.mockResolvedValue({ data: null, error: { message: 'fail' } });
    const { result } = renderHook(() => useRecentCallsData(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('useCallVolumeData success', async () => {
    rpc.mockResolvedValue({ data: [{ hour: '09', incoming: 1, outgoing: 2 }], error: null });
    const { result } = renderHook(() => useCallVolumeData(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].hour).toBe('09');
  });

  it('useCallVolumeData error', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'x' } });
    const { result } = renderHook(() => useCallVolumeData(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('useQueueStatsData success', async () => {
    rpc.mockResolvedValue({ data: { waiting: 3, avgWaitTime: 10, longestWait: 20, abandoned: 1, serviceLevelPercent: 90 }, error: null });
    const { result } = renderHook(() => useQueueStatsData(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.waiting).toBe(3);
  });

  it('useQueueStatsData error', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'x' } });
    const { result } = renderHook(() => useQueueStatsData(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
