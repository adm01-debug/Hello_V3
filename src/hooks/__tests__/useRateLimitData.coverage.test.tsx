import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRateLimitData } from '../useRateLimitData';

const okResult = { data: [], error: null };

vi.mock('@/integrations/supabase/client', () => {
  const builder = () => {
    const b: Record<string, unknown> = {};
    b.select = vi.fn(() => b);
    b.order = vi.fn(() => b);
    b.limit = vi.fn().mockResolvedValue({ data: [], error: null });
    b.eq = vi.fn(() => b);
    b.lt = vi.fn().mockResolvedValue({ data: null, error: null });
    b.update = vi.fn(() => b);
    b.delete = vi.fn(() => b);
    return b;
  };
  return {
    supabase: {
      from: vi.fn(() => builder()),
      channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
      removeChannel: vi.fn(),
    },
  };
});
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

describe('useRateLimitData', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads data and exposes derived state', async () => {
    const { result } = renderHook(() => useRateLimitData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.stats.totalRequests).toBe(0);
    expect(Array.isArray(result.current.chartData)).toBe(true);
    expect(Array.isArray(result.current.filteredLogs)).toBe(true);
  });

  it('filters logs by search term', async () => {
    const { result } = renderHook(() => useRateLimitData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.setSearchTerm('1.2.3.4'));
    expect(result.current.searchTerm).toBe('1.2.3.4');
  });

  it('runs refresh, resolveAlert, unblockIP and cleanOldLogs', async () => {
    const { result } = renderHook(() => useRateLimitData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.refresh(); });
    await act(async () => { await result.current.resolveAlert('a1'); });
    await act(async () => { await result.current.unblockIP('9.9.9.9'); });
    await act(async () => { await result.current.cleanOldLogs(); });
    expect(result.current.refreshing).toBe(false);
  });

  it('handles load errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: null, error: new Error('boom') }),
    }));
    const { result } = renderHook(() => useRateLimitData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.logs).toEqual([]);
  });
});

void okResult;
