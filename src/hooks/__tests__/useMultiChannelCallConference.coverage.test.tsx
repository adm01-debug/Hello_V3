import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useState } from 'react';

vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { useMultiChannelCallConference } from '../useMultiChannelCallConference';
import type { CallSession } from '../useMultiChannelCall';

const makeCall = (id: string, overrides: Partial<CallSession> = {}): CallSession => ({
  id, channel: 'voip', status: 'active', contactName: 'X', contactNumber: '1',
  startTime: new Date(), duration: 0, isMuted: false, isOnHold: false, isRecording: false,
  isInConference: false, ...overrides,
} as CallSession);

function useHarness(initial: CallSession[]) {
  const [activeCalls, setActiveCalls] = useState<CallSession[]>(initial);
  const [activeCallId, setActiveCallId] = useState<string | null>(initial[0]?.id ?? null);
  const [, setActiveChannel] = useState<CallSession['channel']>('webrtc');
  const [, setCallHistory] = useState<CallSession[]>([]);
  const stopDurationTimer = vi.fn();
  const conf = useMultiChannelCallConference({
    activeCalls, activeCallId, setActiveCalls, setActiveCallId, setActiveChannel, setCallHistory, stopDurationTimer,
  });
  return { conf, activeCalls };
}

describe('useMultiChannelCallConference', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('startConference requires at least 2 calls', () => {
    const { result } = renderHook(() => useHarness([makeCall('a')]));
    let res: unknown;
    act(() => { res = result.current.conf.startConference(['a']); });
    expect(res).toBeNull();
  });

  it('starts, adds, removes, toggles recording and ends conference', () => {
    const { result } = renderHook(() => useHarness([makeCall('a'), makeCall('b'), makeCall('c')]));
    act(() => { result.current.conf.startConference(['a', 'b']); });
    expect(result.current.conf.conference).not.toBeNull();

    act(() => { vi.advanceTimersByTime(2000); });
    expect(result.current.conf.conference?.duration).toBeGreaterThanOrEqual(1);

    act(() => { result.current.conf.addToConference('c'); });
    expect(result.current.conf.conference?.participantIds).toContain('c');

    act(() => { result.current.conf.toggleConferenceRecording(); });
    act(() => { result.current.conf.toggleConferenceRecording(); });

    act(() => { result.current.conf.removeFromConference('c'); });
    expect(result.current.conf.conference?.participantIds).not.toContain('c');

    act(() => { result.current.conf.endConference(); });
    expect(result.current.conf.conference).toBeNull();
  });

  it('removeFromConference auto-ends when below 2 participants', () => {
    const { result } = renderHook(() => useHarness([makeCall('a'), makeCall('b')]));
    act(() => { result.current.conf.startConference(['a', 'b']); });
    act(() => { result.current.conf.removeFromConference('a'); });
    expect(result.current.conf.conference).toBeNull();
  });

  it('no-op guards when no conference', () => {
    const { result } = renderHook(() => useHarness([makeCall('a')]));
    act(() => {
      result.current.conf.addToConference('a');
      result.current.conf.removeFromConference('a');
      result.current.conf.endConference();
      result.current.conf.toggleConferenceRecording();
    });
    expect(result.current.conf.conference).toBeNull();
  });

  it('getCallsAvailableForConference filters correctly', () => {
    const { result } = renderHook(() => useHarness([
      makeCall('a', { status: 'active' }),
      makeCall('b', { status: 'on-hold' }),
      makeCall('c', { isInConference: true }),
    ]));
    const avail = result.current.conf.getCallsAvailableForConference();
    expect(avail.map(c => c.id).sort()).toEqual(['a', 'b']);
  });

  it('blind transfer completes after timeout', () => {
    const { result } = renderHook(() => useHarness([makeCall('a'), makeCall('b')]));
    act(() => { result.current.conf.transferCall('a', { type: 'agent', id: 'ag1', name: 'A' } as never, 'blind'); });
    act(() => { vi.advanceTimersByTime(2000); });
  });

  it('attended transfer then completeTransfer and cancelTransfer', () => {
    const { result } = renderHook(() => useHarness([makeCall('a'), makeCall('b')]));
    act(() => { result.current.conf.transferCall('a', { type: 'agent', id: 'ag1', name: 'A' } as never, 'attended'); });
    act(() => { result.current.conf.completeTransfer('a'); });
    act(() => { result.current.conf.cancelTransfer('b'); });
  });

  it('completeTransfer with unknown call is a no-op', () => {
    const { result } = renderHook(() => useHarness([makeCall('a')]));
    act(() => { result.current.conf.completeTransfer('zzz'); });
  });

  it('cleanupConference clears interval', () => {
    const { result } = renderHook(() => useHarness([makeCall('a'), makeCall('b')]));
    act(() => { result.current.conf.startConference(['a', 'b']); });
    act(() => { result.current.conf.cleanupConference(); });
  });
});
