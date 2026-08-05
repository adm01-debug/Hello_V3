import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useVoipQualityMonitor } from '../useVoipQualityMonitor';

const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({ insert: insertMock })),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

type Report = Record<string, unknown>;

function makeStats(reports: Report[]): RTCStatsReport {
  return {
    forEach(cb: (r: Report) => void) { reports.forEach(cb); },
  } as unknown as RTCStatsReport;
}

function makePc(stats: RTCStatsReport, connectionState: RTCPeerConnectionState = 'connected'): RTCPeerConnection {
  return {
    connectionState,
    getStats: vi.fn().mockResolvedValue(stats),
  } as unknown as RTCPeerConnection;
}

describe('useVoipQualityMonitor', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.useRealTimers(); });

  it('returns unknown state when no peer connection', () => {
    const { result } = renderHook(() => useVoipQualityMonitor(null));
    expect(result.current.label).toBe('unknown');
    expect(result.current.samplesCount).toBe(0);
  });

  it('collects stats and computes MOS for a good connection', async () => {
    const stats = makeStats([
      { type: 'inbound-rtp', kind: 'audio', jitter: 0.001, packetsLost: 0, packetsReceived: 500, audioLevel: 0.5 },
      { type: 'remote-inbound-rtp', kind: 'audio', roundTripTime: 0.02 },
    ]);
    const pc = makePc(stats);
    const { result } = renderHook(() => useVoipQualityMonitor(pc, { persistOnEnd: false }));
    await waitFor(() => expect(result.current.samplesCount).toBeGreaterThan(0));
    expect(result.current.current).not.toBeNull();
    expect(result.current.mosAvg).not.toBeNull();
    expect(['excellent', 'good', 'fair', 'poor']).toContain(result.current.label);
  });

  it('uses candidate-pair RTT fallback and tolerates packet loss', async () => {
    const stats = makeStats([
      { type: 'inbound-rtp', kind: 'audio', jitter: 0.05, packetsLost: 50, packetsReceived: 100, audioLevel: 0.2 },
      { type: 'candidate-pair', state: 'succeeded', currentRoundTripTime: 0.3 },
    ]);
    const pc = makePc(stats);
    const { result } = renderHook(() => useVoipQualityMonitor(pc));
    await waitFor(() => expect(result.current.samplesCount).toBeGreaterThan(0));
    expect(result.current.packetLossPct).not.toBeNull();
  });

  it('does not collect when connection is closed', async () => {
    const stats = makeStats([]);
    const pc = makePc(stats, 'closed');
    renderHook(() => useVoipQualityMonitor(pc));
    await new Promise(r => setTimeout(r, 10));
    expect(pc.getStats).not.toHaveBeenCalled();
  });

  it('handles getStats failures gracefully', async () => {
    const pc = {
      connectionState: 'connected',
      getStats: vi.fn().mockRejectedValue(new Error('stats error')),
    } as unknown as RTCPeerConnection;
    const { result } = renderHook(() => useVoipQualityMonitor(pc));
    await new Promise(r => setTimeout(r, 10));
    expect(result.current.samplesCount).toBe(0);
  });

  it('persists metrics on unmount when persistOnEnd is true', async () => {
    const stats = makeStats([
      { type: 'inbound-rtp', kind: 'audio', jitter: 0.002, packetsLost: 1, packetsReceived: 300, audioLevel: 0.4 },
      { type: 'remote-inbound-rtp', kind: 'audio', roundTripTime: 0.05 },
    ]);
    const pc = makePc(stats);
    const { result, unmount } = renderHook(() =>
      useVoipQualityMonitor(pc, { persistOnEnd: true, callSessionId: 'cs1', agentName: 'agent', channel: 'webrtc' }),
    );
    await waitFor(() => expect(result.current.samplesCount).toBeGreaterThan(0));
    await act(async () => { unmount(); });
    await waitFor(() => expect(insertMock).toHaveBeenCalled());
  });

  it('collects repeatedly on interval', async () => {
    vi.useFakeTimers();
    const stats = makeStats([
      { type: 'inbound-rtp', kind: 'audio', jitter: 0.001, packetsLost: 0, packetsReceived: 100, audioLevel: 0.5 },
    ]);
    const pc = makePc(stats);
    renderHook(() => useVoipQualityMonitor(pc));
    await act(async () => { await Promise.resolve(); });
    await act(async () => { vi.advanceTimersByTime(2000); await Promise.resolve(); });
    expect((pc.getStats as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThanOrEqual(2);
    vi.useRealTimers();
  });
});
