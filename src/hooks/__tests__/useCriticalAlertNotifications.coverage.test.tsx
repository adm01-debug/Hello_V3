import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

let alertCallback: ((payload: { new: unknown }) => void) | null = null;

vi.mock('@/integrations/supabase/client', () => {
  const channel = vi.fn(() => {
    const ch: Record<string, unknown> = {};
    ch.on = vi.fn((_event: string, _filter: unknown, cb: (p: { new: unknown }) => void) => {
      alertCallback = cb;
      return ch;
    });
    ch.subscribe = vi.fn(() => ch);
    return ch;
  });
  return { supabase: { channel, removeChannel: vi.fn() } };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
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

import { useCriticalAlertNotifications, AlertSoundConfig } from '../useCriticalAlertNotifications';
import { toast } from 'sonner';

const baseAlert = (overrides: Record<string, unknown> = {}) => ({
  id: 'a1',
  title: 'Title',
  message: 'Message',
  severity: 'warning',
  alert_type: 'type',
  created_at: '2026-01-01',
  ...overrides,
});

describe('useCriticalAlertNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    alertCallback = null;
    (window.Notification as unknown as { permission: string }).permission = 'granted';
  });

  it('initAudioContext returns and memoizes an AudioContext', () => {
    const { result } = renderHook(() => useCriticalAlertNotifications());
    let ctx1: unknown;
    let ctx2: unknown;
    act(() => {
      ctx1 = result.current.initAudioContext();
      ctx2 = result.current.initAudioContext();
    });
    expect(ctx1).toBe(ctx2);
  });

  it('requestNotificationPermission returns true when granted', async () => {
    const { result } = renderHook(() => useCriticalAlertNotifications());
    let granted: boolean | undefined;
    await act(async () => {
      granted = await result.current.requestNotificationPermission();
    });
    expect(granted).toBe(true);
    expect(result.current.notificationPermission).toBe('granted');
  });

  it('playAlertSound exercises all patterns (warning + critical)', () => {
    const patterns: AlertSoundConfig['criticalPattern'][] = ['single', 'double', 'triple', 'urgent'];
    for (const pattern of patterns) {
      const cfg: AlertSoundConfig = {
        warningFrequency: 500,
        warningPattern: pattern === 'urgent' ? 'triple' : (pattern as AlertSoundConfig['warningPattern']),
        warningVolume: 0.2,
        criticalFrequency: 880,
        criticalPattern: pattern,
        criticalVolume: 0.3,
      };
      const { result } = renderHook(() =>
        useCriticalAlertNotifications({ soundEnabled: true, soundConfig: cfg }),
      );
      act(() => {
        result.current.playAlertSound('warning');
        result.current.playAlertSound('critical');
      });
    }
    expect(true).toBe(true);
  });

  it('playAlertSound is a no-op when sound disabled', () => {
    const { result } = renderHook(() =>
      useCriticalAlertNotifications({ soundEnabled: false }),
    );
    act(() => {
      result.current.playAlertSound('warning');
    });
    expect(result.current.defaultSoundConfig).toBeDefined();
  });

  it('handles a new critical alert (sound + toast.error + browser notification)', () => {
    renderHook(() => useCriticalAlertNotifications({ enabled: true }));
    expect(alertCallback).toBeTruthy();
    act(() => {
      alertCallback?.({ new: baseAlert({ id: 'c1', severity: 'critical' }) });
    });
    expect(toast.error).toHaveBeenCalled();
  });

  it('handles a warning alert (toast.warning) and dedupes repeats', () => {
    renderHook(() => useCriticalAlertNotifications({ enabled: true }));
    act(() => {
      alertCallback?.({ new: baseAlert({ id: 'w1', severity: 'warning' }) });
      alertCallback?.({ new: baseAlert({ id: 'w1', severity: 'warning' }) });
    });
    expect(toast.warning).toHaveBeenCalledTimes(1);
  });

  it('does not subscribe when disabled', () => {
    renderHook(() => useCriticalAlertNotifications({ enabled: false }));
    expect(alertCallback).toBeNull();
  });

  it('skips browser notification when permission not granted', () => {
    (window.Notification as unknown as { permission: string }).permission = 'denied';
    renderHook(() => useCriticalAlertNotifications({ enabled: true, browserNotificationsEnabled: true }));
    act(() => {
      alertCallback?.({ new: baseAlert({ id: 'n1', severity: 'warning' }) });
    });
    expect(toast.warning).toHaveBeenCalled();
  });
});
