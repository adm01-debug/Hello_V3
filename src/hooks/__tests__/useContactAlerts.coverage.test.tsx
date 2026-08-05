import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// ---- Mocks ----

type Result = { data: unknown; error: unknown };

// Mutable holders so each test can drive resolved values
const state: {
  selectResult: Result;
  updateResult: Result;
  deleteResult: Result;
  invokeResult: Result;
} = {
  selectResult: { data: [], error: null },
  updateResult: { data: null, error: null },
  deleteResult: { data: null, error: null },
  invokeResult: { data: null, error: null },
};

// Capture the realtime handler so tests can fire payloads
let realtimeHandler: ((payload: { new: unknown }) => void) | null = null;

// Build a chainable select query that is awaitable (thenable) and supports .eq()
const makeSelectChain = () => {
  const chain: Record<string, unknown> = {};
  ['select', 'order', 'limit'].forEach((m) => {
    chain[m] = vi.fn(() => chain);
  });
  // eq returns the chain too (used for unreadOnly path)
  chain.eq = vi.fn(() => chain);
  (chain as { then: (resolve: (v: Result) => void) => void }).then = (resolve) =>
    resolve(state.selectResult);
  return chain;
};

// update().eq() resolves to updateResult
const makeUpdateChain = () => {
  const chain: Record<string, unknown> = {};
  chain.eq = vi.fn(() => Promise.resolve(state.updateResult));
  return chain;
};

// delete().eq() resolves to deleteResult
const makeDeleteChain = () => {
  const chain: Record<string, unknown> = {};
  chain.eq = vi.fn(() => Promise.resolve(state.deleteResult));
  return chain;
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => makeSelectChain()),
      update: vi.fn(() => makeUpdateChain()),
      delete: vi.fn(() => makeDeleteChain()),
    })),
    functions: {
      invoke: vi.fn(() => Promise.resolve(state.invokeResult)),
    },
    channel: vi.fn(() => {
      const ch = {
        on: vi.fn((_event: string, _filter: unknown, handler: (payload: { new: unknown }) => void) => {
          realtimeHandler = handler;
          return ch;
        }),
        subscribe: vi.fn(() => ch),
      };
      return ch;
    }),
    removeChannel: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    create: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { useContactAlerts, type ContactAlert } from '@/hooks/useContactAlerts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function makeAlert(id: string, isRead = false): ContactAlert {
  return {
    id,
    contact_id: `contact-${id}`,
    alert_type: 'churn_risk',
    severity: 'high',
    title: `Alert ${id}`,
    message: `Message ${id}`,
    trigger_data: {},
    is_read: isRead,
    is_actioned: false,
    actioned_at: null,
    actioned_by: null,
    created_at: new Date().toISOString(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  realtimeHandler = null;
  state.selectResult = { data: [makeAlert('1', false), makeAlert('2', true)], error: null };
  state.updateResult = { data: null, error: null };
  state.deleteResult = { data: null, error: null };
  state.invokeResult = { data: null, error: null };
});

describe('useContactAlerts', () => {
  it('fetches alerts on mount and computes unread count', async () => {
    const { result } = renderHook(() => useContactAlerts());
    await waitFor(() => expect(result.current.alerts.length).toBe(2));
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.isLoading).toBe(false);
  });

  it('fetchAlerts with unreadOnly applies eq filter', async () => {
    const { result } = renderHook(() => useContactAlerts());
    await waitFor(() => expect(result.current.alerts.length).toBe(2));

    state.selectResult = { data: [makeAlert('1', false)], error: null };
    let returned: ContactAlert[] = [];
    await act(async () => {
      returned = await result.current.fetchAlerts(true);
    });
    expect(returned.length).toBe(1);
    expect(supabase.from).toHaveBeenCalledWith('contact_alerts');
  });

  it('fetchAlerts handles error and returns empty', async () => {
    const { result } = renderHook(() => useContactAlerts());
    await waitFor(() => expect(result.current.alerts.length).toBe(2));

    state.selectResult = { data: null, error: new Error('boom') };
    let returned: ContactAlert[] = [];
    await act(async () => {
      returned = await result.current.fetchAlerts();
    });
    expect(returned).toEqual([]);
  });

  it('markAsRead updates state and decrements unread', async () => {
    const { result } = renderHook(() => useContactAlerts());
    await waitFor(() => expect(result.current.alerts.length).toBe(2));

    await act(async () => {
      await result.current.markAsRead('1');
    });
    await waitFor(() => {
      expect(result.current.alerts.find((a) => a.id === '1')?.is_read).toBe(true);
    });
    expect(result.current.unreadCount).toBe(0);
  });

  it('markAsRead handles error branch', async () => {
    const { result } = renderHook(() => useContactAlerts());
    await waitFor(() => expect(result.current.alerts.length).toBe(2));

    state.updateResult = { data: null, error: new Error('update failed') };
    await act(async () => {
      await result.current.markAsRead('1');
    });
    // On error the alert should NOT be flipped
    expect(result.current.alerts.find((a) => a.id === '1')?.is_read).toBe(false);
  });

  it('markAllAsRead flips all and shows toast', async () => {
    const { result } = renderHook(() => useContactAlerts());
    await waitFor(() => expect(result.current.alerts.length).toBe(2));

    await act(async () => {
      await result.current.markAllAsRead();
    });
    await waitFor(() => {
      expect(result.current.alerts.every((a) => a.is_read)).toBe(true);
    });
    expect(result.current.unreadCount).toBe(0);
    expect(toast.success).toHaveBeenCalled();
  });

  it('markAllAsRead handles error branch', async () => {
    const { result } = renderHook(() => useContactAlerts());
    await waitFor(() => expect(result.current.alerts.length).toBe(2));

    state.updateResult = { data: null, error: new Error('fail') };
    await act(async () => {
      await result.current.markAllAsRead();
    });
    expect(result.current.alerts.some((a) => !a.is_read)).toBe(true);
  });

  it('markAsActioned updates state and shows toast', async () => {
    const { result } = renderHook(() => useContactAlerts());
    await waitFor(() => expect(result.current.alerts.length).toBe(2));

    await act(async () => {
      await result.current.markAsActioned('1', 'tester');
    });
    await waitFor(() => {
      expect(result.current.alerts.find((a) => a.id === '1')?.is_actioned).toBe(true);
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it('markAsActioned uses default actionedBy and handles error', async () => {
    const { result } = renderHook(() => useContactAlerts());
    await waitFor(() => expect(result.current.alerts.length).toBe(2));

    // default actionedBy path (no arg)
    await act(async () => {
      await result.current.markAsActioned('2');
    });

    state.updateResult = { data: null, error: new Error('fail') };
    await act(async () => {
      await result.current.markAsActioned('1');
    });
    expect(result.current.alerts.find((a) => a.id === '1')?.is_actioned).toBe(false);
  });

  it('deleteAlert removes from state and shows toast', async () => {
    const { result } = renderHook(() => useContactAlerts());
    await waitFor(() => expect(result.current.alerts.length).toBe(2));

    await act(async () => {
      await result.current.deleteAlert('1');
    });
    await waitFor(() => {
      expect(result.current.alerts.find((a) => a.id === '1')).toBeUndefined();
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it('deleteAlert handles error branch', async () => {
    const { result } = renderHook(() => useContactAlerts());
    await waitFor(() => expect(result.current.alerts.length).toBe(2));

    state.deleteResult = { data: null, error: new Error('fail') };
    await act(async () => {
      await result.current.deleteAlert('1');
    });
    expect(result.current.alerts.find((a) => a.id === '1')).toBeDefined();
  });

  it('checkForNewAlerts triggers info toast and refetch when alerts created', async () => {
    const { result } = renderHook(() => useContactAlerts());
    await waitFor(() => expect(result.current.alerts.length).toBe(2));

    state.invokeResult = { data: { alerts_created: 3 }, error: null };
    let data: unknown;
    await act(async () => {
      data = await result.current.checkForNewAlerts();
    });
    expect(data).toEqual({ alerts_created: 3 });
    expect(toast.info).toHaveBeenCalled();
  });

  it('checkForNewAlerts with zero created does not toast', async () => {
    const { result } = renderHook(() => useContactAlerts());
    await waitFor(() => expect(result.current.alerts.length).toBe(2));

    state.invokeResult = { data: { alerts_created: 0 }, error: null };
    await act(async () => {
      await result.current.checkForNewAlerts();
    });
    expect(toast.info).not.toHaveBeenCalled();
  });

  it('checkForNewAlerts handles error and returns null', async () => {
    const { result } = renderHook(() => useContactAlerts());
    await waitFor(() => expect(result.current.alerts.length).toBe(2));

    state.invokeResult = { data: null, error: new Error('invoke failed') };
    let data: unknown = 'unset';
    await act(async () => {
      data = await result.current.checkForNewAlerts();
    });
    expect(data).toBeNull();
  });

  it('realtime INSERT prepends alert, increments unread, and shows toast', async () => {
    const { result } = renderHook(() => useContactAlerts());
    await waitFor(() => expect(result.current.alerts.length).toBe(2));
    expect(realtimeHandler).toBeTruthy();

    const newAlert = makeAlert('99', false);
    act(() => {
      realtimeHandler?.({ new: newAlert });
    });

    await waitFor(() => {
      expect(result.current.alerts[0].id).toBe('99');
    });
    expect(result.current.unreadCount).toBe(2);
    expect(toast).toHaveBeenCalled();
  });

  it('cleans up channel on unmount', async () => {
    const { result, unmount } = renderHook(() => useContactAlerts());
    await waitFor(() => expect(result.current.alerts.length).toBe(2));
    unmount();
    expect(supabase.removeChannel).toHaveBeenCalled();
  });
});
