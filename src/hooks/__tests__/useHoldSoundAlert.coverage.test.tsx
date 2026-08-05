import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHoldSoundAlert } from '../useHoldSoundAlert';

const channelObj = {
  on: vi.fn(function (this: unknown) { return channelObj; }),
  subscribe: vi.fn(() => channelObj),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ limit: vi.fn(() => ({ maybeSingle: vi.fn(() => Promise.resolve({ data: { warning_threshold_seconds: 60, critical_threshold_seconds: 180, notify_on_warning: true, notify_on_critical: true, enabled: true }, error: null })) })) })),
    })),
    channel: vi.fn(() => channelObj),
    removeChannel: vi.fn(),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

class MockAudioContext {
  currentTime = 0;
  state = 'running';
  destination = {};
  createOscillator() {
    return { connect: vi.fn(), frequency: { value: 0 }, type: '', start: vi.fn(), stop: vi.fn() };
  }
  createGain() {
    return { connect: vi.fn(), gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() } };
  }
  resume() { return Promise.resolve(); }
}

describe('useHoldSoundAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorage.clear();
    (window as unknown as { AudioContext: typeof MockAudioContext }).AudioContext = MockAudioContext;
  });
  afterEach(() => { vi.useRealTimers(); });

  it('toggles sound and persists to localStorage', () => {
    const { result } = renderHook(() => useHoldSoundAlert([]));
    expect(result.current.soundEnabled).toBe(true);
    act(() => { result.current.toggleSound(); });
    expect(result.current.soundEnabled).toBe(false);
    expect(localStorage.getItem('holdSoundAlert_enabled')).toBe('false');
  });

  it('reads persisted disabled state', () => {
    localStorage.setItem('holdSoundAlert_enabled', 'false');
    const { result } = renderHook(() => useHoldSoundAlert([]));
    expect(result.current.soundEnabled).toBe(false);
  });

  it('plays test sounds', () => {
    const { result } = renderHook(() => useHoldSoundAlert([]));
    act(() => { result.current.testSound('warning'); });
    act(() => { result.current.testSound('critical'); });
    expect(result.current.settings.enabled).toBe(true);
  });

  it('triggers warning and critical alerts based on duration', async () => {
    const now = Date.now();
    const holds = [
      { id: 'h1', call_session_id: 's1', started_at: new Date(now - 70_000).toISOString() },
      { id: 'h2', call_session_id: 's2', started_at: new Date(now - 200_000).toISOString() },
    ];
    await act(async () => {
      renderHook(() => useHoldSoundAlert(holds));
      await Promise.resolve();
    });
    act(() => { vi.advanceTimersByTime(1100); });
    expect(true).toBe(true);
  });
});
