import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTrunkUsageReporter } from '../useTrunkUsageReporter';

const rpc = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: (...a: unknown[]) => rpc(...a) },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

describe('useTrunkUsageReporter', () => {
  beforeEach(() => { vi.clearAllMocks(); rpc.mockResolvedValue({ error: null }); });

  it('records usage when trunk context present', async () => {
    const { result } = renderHook(() => useTrunkUsageReporter());
    act(() => {
      result.current.startTracking({ trunk_id: 't1', failover: true, failover_reason: 'timeout', original_trunk_id: 't0' });
    });
    await act(async () => { await result.current.endTracking('cs1'); });
    expect(rpc).toHaveBeenCalledWith('record_trunk_usage', expect.objectContaining({ p_trunk_id: 't1', p_was_failover: true }));
  });

  it('no-op when no trunk_id', async () => {
    const { result } = renderHook(() => useTrunkUsageReporter());
    act(() => { result.current.startTracking({ failover: false }); });
    await act(async () => { await result.current.endTracking('cs1'); });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('no-op when start given null', async () => {
    const { result } = renderHook(() => useTrunkUsageReporter());
    act(() => { result.current.startTracking(null); });
    await act(async () => { await result.current.endTracking(null); });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('swallows rpc error', async () => {
    rpc.mockResolvedValue({ error: new Error('rpc fail') });
    const { result } = renderHook(() => useTrunkUsageReporter());
    act(() => { result.current.startTracking({ trunk_id: 't1', failover: false }); });
    await act(async () => { await result.current.endTracking('cs1'); });
    expect(rpc).toHaveBeenCalled();
  });
});
