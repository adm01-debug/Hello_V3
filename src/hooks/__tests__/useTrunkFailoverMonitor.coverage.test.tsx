import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const h = vi.hoisted(() => ({
  capturedCallback: undefined as ((payload: unknown) => void) | undefined,
  removeChannelMock: vi.fn(),
  subscribeMock: vi.fn(),
  toastWarning: vi.fn(),
  warnMock: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: vi.fn(() => {
      const ch: Record<string, unknown> = {};
      ch.on = vi.fn((_event: string, _filter: unknown, cb: (p: unknown) => void) => {
        h.capturedCallback = cb;
        return ch;
      });
      ch.subscribe = vi.fn(() => {
        h.subscribeMock();
        return ch;
      });
      return ch;
    }),
    removeChannel: (...a: unknown[]) => h.removeChannelMock(...a),
  },
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(), error: vi.fn(), warning: (...a: unknown[]) => h.toastWarning(...a), info: vi.fn(),
  }),
}));

vi.mock('@/lib/logger', () => {
  const sub = { debug: vi.fn(), info: vi.fn(), warn: (...a: unknown[]) => h.warnMock(...a), error: vi.fn() };
  return {
    logger: { create: vi.fn(() => sub), debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  };
});

import { useTrunkFailoverMonitor } from '@/hooks/useTrunkFailoverMonitor';

describe('useTrunkFailoverMonitor', () => {
  beforeEach(() => {
    h.capturedCallback = undefined;
    h.removeChannelMock.mockReset();
    h.subscribeMock.mockReset();
    h.toastWarning.mockReset();
    h.warnMock.mockReset();
  });

  it('subscribes to channel and cleans up on unmount', () => {
    const { unmount } = renderHook(() => useTrunkFailoverMonitor());
    expect(h.capturedCallback).toBeTypeOf('function');
    expect(h.subscribeMock).toHaveBeenCalled();
    unmount();
    expect(h.removeChannelMock).toHaveBeenCalled();
  });

  it('fires a warning toast when failover_count increases', () => {
    renderHook(() => useTrunkFailoverMonitor());
    h.capturedCallback?.({
      old: { failover_count: 1 },
      new: { failover_count: 2, name: 'Trunk-A', failover_reason: 'timeout' },
    });
    expect(h.warnMock).toHaveBeenCalled();
    expect(h.toastWarning).toHaveBeenCalledWith(
      'Failover Automático Realizado',
      expect.objectContaining({ duration: 8000 }),
    );
  });

  it('does not fire when failover_count did not increase', () => {
    renderHook(() => useTrunkFailoverMonitor());
    h.capturedCallback?.({
      old: { failover_count: 2 },
      new: { failover_count: 2, name: 'Trunk-A' },
    });
    expect(h.toastWarning).not.toHaveBeenCalled();
  });

  it('handles missing counts via defaults', () => {
    renderHook(() => useTrunkFailoverMonitor());
    h.capturedCallback?.({ old: {}, new: { failover_count: 1, name: 'Trunk-B' } });
    expect(h.toastWarning).toHaveBeenCalled();
  });
});
