import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { toast } from 'sonner';
import { useHoldReminder } from '../useHoldReminder';
import type { CallSession } from '../useMultiChannelCall';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [], error: null }) })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
    removeChannel: vi.fn(),
  },
}));
vi.mock('../useMultiChannelCall', () => ({}));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { create: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }) } }));
vi.mock('@/lib/holdReminderSounds', () => ({
  createNotificationSound: () => vi.fn(),
  createUrgentSound: () => vi.fn(),
  formatHoldTime: (s: number) => `${s}s`,
  loadSavedInterval: () => 30,
  loadSavedEnabled: () => true,
  loadSavedAlertThreshold: () => 60,
  loadSavedAlertsEnabled: () => true,
  saveToStorage: vi.fn(),
  STORAGE_KEY_INTERVAL: 'i',
  STORAGE_KEY_ENABLED: 'e',
  STORAGE_KEY_ALERT_THRESHOLD: 't',
  STORAGE_KEY_ALERTS_ENABLED: 'ae',
  REMINDER_INTERVALS: [],
  ALERT_THRESHOLDS: [],
}));

function makeCall(over: Partial<CallSession> = {}): CallSession {
  return {
    id: over.id ?? 'c1',
    channel: 'sip',
    status: 'on-hold',
    phoneNumber: '5511999',
    contactName: 'Test',
    startedAt: new Date(),
    duration: 0,
    totalHoldTime: over.totalHoldTime ?? 0,
    holdCount: 1,
    isMuted: false,
    isOnHold: over.isOnHold ?? true,
    isRecording: false,
    isInConference: false,
    transcripts: [],
    ...over,
  } as CallSession;
}

describe('useHoldReminder (coverage)', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.useRealTimers(); });

  const EMPTY: CallSession[] = [];

  it('exposes settings and toggles', async () => {
    const { result } = renderHook((calls: CallSession[]) => useHoldReminder(calls), { initialProps: EMPTY });
    expect(result.current.isEnabled).toBe(true);
    act(() => result.current.toggleReminder());
    await waitFor(() => expect(result.current.isEnabled).toBe(false));
    act(() => result.current.toggleAlerts());
    act(() => result.current.changeInterval(15));
    await waitFor(() => expect(result.current.interval).toBe(15));
    act(() => result.current.changeAlertThreshold(120));
    await waitFor(() => expect(result.current.alertThreshold).toBe(120));
    act(() => result.current.clearAlerts());
    act(() => result.current.initAudio());
  });

  it('triggers warning then critical alerts as hold time crosses thresholds', async () => {
    vi.useFakeTimers();
    const warningCall = makeCall({ id: 'w', totalHoldTime: 70 });
    const { result, rerender } = renderHook((calls: CallSession[]) => useHoldReminder(calls), {
      initialProps: [warningCall],
    });
    // Advance the interval synchronously under fake timers (an async `act` would
    // deadlock because its flush relies on a faked setTimeout that never fires).
    act(() => { vi.advanceTimersByTime(1100); });
    vi.useRealTimers();
    await waitFor(() => expect(result.current.activeAlerts.some(a => a.severity === 'warning')).toBe(true));

    vi.useFakeTimers();
    rerender([makeCall({ id: 'w', totalHoldTime: 200 })]);
    act(() => { vi.advanceTimersByTime(1100); });
    vi.useRealTimers();
    await waitFor(() => expect(result.current.activeAlerts.some(a => a.severity === 'critical')).toBe(true));
  });

  it('requestBrowserNotifications resolves to granted', async () => {
    (window.Notification as unknown as { requestPermission: () => Promise<string> }).requestPermission =
      vi.fn().mockResolvedValue('granted');
    const { result } = renderHook((calls: CallSession[]) => useHoldReminder(calls), { initialProps: EMPTY });
    let granted: boolean | undefined;
    await act(async () => { granted = await result.current.requestBrowserNotifications(); });
    expect(granted).toBe(true);
  });

  it('callsOnHold reflects active held calls', async () => {
    const held: CallSession[] = [makeCall({ id: 'h', isOnHold: true })];
    const { result } = renderHook((calls: CallSession[]) => useHoldReminder(calls), { initialProps: held });
    expect(result.current.callsOnHold).toHaveLength(1);
  });

  it('plays hold reminder visual notification on interval', async () => {
    vi.useFakeTimers();
    const held: CallSession[] = [makeCall({ id: 'p', isOnHold: true, totalHoldTime: 5 })];
    renderHook((calls: CallSession[]) => useHoldReminder(calls), { initialProps: held });
    act(() => { vi.advanceTimersByTime(2100); });
    vi.useRealTimers();
    await waitFor(() => expect(toast).toHaveBeenCalled());
  });
});
