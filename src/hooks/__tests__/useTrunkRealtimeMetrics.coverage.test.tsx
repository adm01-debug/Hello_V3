import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTrunkRealtimeMetrics } from '../useTrunkRealtimeMetrics';

interface QueryResult { data: unknown; error: unknown }
const responses: Record<string, QueryResult> = {
  call_sessions: { data: [{ id: 'c1', status: 'active' }, { id: 'c2', status: 'active' }], error: null },
  voip_trunks: { data: [{ id: 't1', name: 'A', max_channels: 4, last_health_latency_ms: 50, last_health_status: 'healthy' }], error: null },
};

const channelObj = {
  on: vi.fn(function (this: unknown) { return channelObj; }),
  subscribe: vi.fn(() => channelObj),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve(responses[table])),
        then: (res: (v: QueryResult) => unknown) => Promise.resolve(responses[table]).then(res),
      })),
    })),
    channel: vi.fn(() => channelObj),
    removeChannel: vi.fn(),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

describe('useTrunkRealtimeMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    responses.call_sessions = { data: [{ id: 'c1', status: 'active' }, { id: 'c2', status: 'active' }], error: null };
    responses.voip_trunks = { data: [{ id: 't1', name: 'A', max_channels: 4, last_health_latency_ms: 50, last_health_status: 'healthy' }], error: null };
  });

  it('computes occupancy metrics', async () => {
    const { result } = renderHook(() => useTrunkRealtimeMetrics());
    await waitFor(() => expect(result.current.totalActive).toBe(2));
    expect(result.current.metrics.length).toBe(1);
    expect(result.current.metrics[0].occupancy).toBeGreaterThan(0);
    expect(result.current.metrics[0].latency).toBe(50);
  });

  it('handles trunk with zero max_channels and no calls', async () => {
    responses.call_sessions = { data: [], error: null };
    responses.voip_trunks = { data: [{ id: 't1', name: 'A', max_channels: 0, last_health_latency_ms: null, last_health_status: null }], error: null };
    const { result } = renderHook(() => useTrunkRealtimeMetrics());
    await waitFor(() => expect(result.current.metrics.length).toBe(1));
    expect(result.current.metrics[0].occupancy).toBe(0);
    expect(result.current.metrics[0].latency).toBe(0);
  });
});
