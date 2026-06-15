import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAchievementNotifications } from '../useAchievementNotifications';

type PgHandler = (payload: { new: Record<string, unknown> }) => void | Promise<void>;

interface ChannelStub {
  on: (event: string, config: Record<string, unknown>, handler: PgHandler) => ChannelStub;
  subscribe: () => ChannelStub;
}

// Capture registered postgres_changes handlers keyed by channel name.
const handlers: Record<string, PgHandler> = {};

const badgeResult = { data: { id: 'b1', name: 'Star', points: 50 }, error: null };
const agentResult = { data: { name: 'Alice' }, error: null };
const maybeSingle = vi.fn();

vi.mock('@/integrations/supabase/client', () => {
  const channel = vi.fn((name: string): ChannelStub => {
    const stub: ChannelStub = {
      on: vi.fn((_event: string, _config: Record<string, unknown>, handler: PgHandler) => {
        handlers[name] = handler;
        return stub;
      }),
      subscribe: vi.fn(() => stub),
    };
    return stub;
  });
  return {
    supabase: {
      channel,
      removeChannel: vi.fn(),
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: (...a: unknown[]) => (maybeSingle as (...args: unknown[]) => unknown)(...a),
      })),
    },
  };
});

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({
  logger: { create: () => ({ debug: vi.fn(), info: vi.fn(), error: vi.fn(), warn: vi.fn() }), error: vi.fn() },
}));

import { toast } from 'sonner';

describe('useAchievementNotifications (coverage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(handlers)) delete handlers[k];
    maybeSingle.mockReset();
    // First call -> badge, second call -> agent
    maybeSingle.mockResolvedValueOnce(badgeResult).mockResolvedValueOnce(agentResult);
  });

  it('subscribes to channels and exposes initial state', () => {
    const { result } = renderHook(() => useAchievementNotifications());
    expect(result.current.notifications).toEqual([]);
    expect(result.current.latestAchievement).toBeNull();
    expect(typeof result.current.clearLatestAchievement).toBe('function');
    expect(handlers['badge-achievements']).toBeTypeOf('function');
    expect(handlers['goal-achievements']).toBeTypeOf('function');
  });

  it('handles a new badge award and shows a toast (no agent filter)', async () => {
    const { result } = renderHook(() => useAchievementNotifications());
    await act(async () => {
      await handlers['badge-achievements']({
        new: { id: 'n1', agent_id: 'a1', badge_id: 'b1', earned_at: '2026-01-01' },
      });
    });
    await waitFor(() => expect(result.current.latestAchievement).not.toBeNull());
    expect(result.current.notifications.length).toBe(1);
    expect(result.current.latestAchievement?.agentName).toBe('Alice');
    expect(toast.success).toHaveBeenCalled();
  });

  it('does not toast when agentId filter does not match', async () => {
    const { result } = renderHook(() => useAchievementNotifications('other-agent'));
    await act(async () => {
      await handlers['badge-achievements']({
        new: { id: 'n2', agent_id: 'a1', badge_id: 'b1', earned_at: '2026-01-01' },
      });
    });
    await waitFor(() => expect(result.current.latestAchievement).not.toBeNull());
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('skips notification when badge or agent missing', async () => {
    maybeSingle.mockReset();
    maybeSingle.mockResolvedValueOnce({ data: null, error: null }).mockResolvedValueOnce({ data: null, error: null });
    const { result } = renderHook(() => useAchievementNotifications());
    await act(async () => {
      await handlers['badge-achievements']({
        new: { id: 'n3', agent_id: 'a1', badge_id: 'b1', earned_at: '2026-01-01' },
      });
    });
    expect(result.current.notifications.length).toBe(0);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('handles goal-achieved alerts with a toast', () => {
    renderHook(() => useAchievementNotifications());
    act(() => {
      handlers['goal-achievements']({ new: { title: 'Goal!', message: 'msg' } });
    });
    expect(toast.success).toHaveBeenCalledWith('🎯 Meta Atingida!', expect.objectContaining({ description: 'Goal!' }));
  });

  it('clearLatestAchievement resets the latest achievement', async () => {
    const { result } = renderHook(() => useAchievementNotifications());
    await act(async () => {
      await handlers['badge-achievements']({
        new: { id: 'n4', agent_id: 'a1', badge_id: 'b1', earned_at: '2026-01-01' },
      });
    });
    await waitFor(() => expect(result.current.latestAchievement).not.toBeNull());
    act(() => result.current.clearLatestAchievement());
    expect(result.current.latestAchievement).toBeNull();
  });
});
