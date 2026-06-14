import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCallTransfer } from '../useCallTransfer';
import type { CallSession } from '../useMultiChannelCall';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

function makeCall(id: string, overrides: Partial<CallSession> = {}): CallSession {
  return {
    id,
    channel: 'webrtc',
    status: 'active',
    direction: 'inbound',
    duration: 0,
    totalHoldTime: 0,
    holdCount: 0,
    isMuted: false,
    isOnHold: false,
    isRecording: false,
    isInConference: false,
    transcripts: [],
    ...overrides,
  };
}

describe('useCallTransfer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('blind transfer sets transferring status then completes after timeout', () => {
    const calls = [makeCall('c1'), makeCall('c2')];
    const setActiveCalls = vi.fn();
    const setActiveCallId = vi.fn();
    const setActiveChannel = vi.fn();
    const stopDurationTimer = vi.fn();
    const setCallHistory = vi.fn();

    const { result } = renderHook(() =>
      useCallTransfer(calls, 'c1', setActiveCalls, setActiveCallId, setActiveChannel, stopDurationTimer, setCallHistory),
    );

    act(() => {
      result.current.transferCall('c1', { type: 'agent', name: 'Ana', phoneNumber: '100' }, 'blind');
    });
    expect(setActiveCalls).toHaveBeenCalled();
    // exercise the map updater for matching + non-matching id
    const updater = setActiveCalls.mock.calls[0][0] as (p: CallSession[]) => CallSession[];
    const mapped = updater(calls);
    expect(mapped[0].status).toBe('transferring');
    expect(mapped[1].id).toBe('c2');

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    // completeTransfer ran
    expect(stopDurationTimer).toHaveBeenCalledWith('c1');
    expect(setCallHistory).toHaveBeenCalled();
    const histUpdater = setCallHistory.mock.calls[0][0] as (p: CallSession[]) => CallSession[];
    expect(histUpdater([])[0].status).toBe('ended');
    // remaining has c2 and activeCallId === c1 -> switch active
    expect(setActiveCallId).toHaveBeenCalledWith('c2');
    expect(setActiveChannel).toHaveBeenCalledWith('webrtc');
  });

  it('attended transfer puts call on hold and does not auto-complete', () => {
    const calls = [makeCall('c1')];
    const setActiveCalls = vi.fn();
    const { result } = renderHook(() =>
      useCallTransfer(calls, 'c1', setActiveCalls, vi.fn(), vi.fn(), vi.fn(), vi.fn()),
    );

    act(() => {
      result.current.transferCall('c1', { type: 'external', phoneNumber: '200' }, 'attended');
    });
    const updater = setActiveCalls.mock.calls[0][0] as (p: CallSession[]) => CallSession[];
    const mapped = updater(calls);
    expect(mapped[0].status).toBe('on-hold');
    expect(mapped[0].isOnHold).toBe(true);

    act(() => vi.advanceTimersByTime(5000));
    // only the transferCall update, no auto completeTransfer
    expect(setActiveCalls).toHaveBeenCalledTimes(1);
  });

  it('completeTransfer returns early when call not found', () => {
    const setCallHistory = vi.fn();
    const stopDurationTimer = vi.fn();
    const { result } = renderHook(() =>
      useCallTransfer([], null, vi.fn(), vi.fn(), vi.fn(), stopDurationTimer, setCallHistory),
    );
    act(() => result.current.completeTransfer('missing'));
    expect(stopDurationTimer).not.toHaveBeenCalled();
    expect(setCallHistory).not.toHaveBeenCalled();
  });

  it('completeTransfer sets active id null when no remaining calls', () => {
    const calls = [makeCall('only')];
    const setActiveCallId = vi.fn();
    const setActiveChannel = vi.fn();
    const { result } = renderHook(() =>
      useCallTransfer(calls, 'only', vi.fn(), setActiveCallId, setActiveChannel, vi.fn(), vi.fn()),
    );
    act(() => result.current.completeTransfer('only'));
    expect(setActiveCallId).toHaveBeenCalledWith(null);
    expect(setActiveChannel).not.toHaveBeenCalled();
  });

  it('completeTransfer keeps active id when removed call is not the active one', () => {
    const calls = [makeCall('a'), makeCall('b')];
    const setActiveCallId = vi.fn();
    const { result } = renderHook(() =>
      useCallTransfer(calls, 'b', vi.fn(), setActiveCallId, vi.fn(), vi.fn(), vi.fn()),
    );
    act(() => result.current.completeTransfer('a'));
    // remaining length > 0 but activeCallId !== removed id -> neither branch fires
    expect(setActiveCallId).not.toHaveBeenCalled();
  });

  it('cancelTransfer restores active state', () => {
    const calls = [makeCall('c1', { status: 'on-hold', isOnHold: true, isTransferring: true })];
    const setActiveCalls = vi.fn();
    const { result } = renderHook(() =>
      useCallTransfer(calls, 'c1', setActiveCalls, vi.fn(), vi.fn(), vi.fn(), vi.fn()),
    );
    act(() => result.current.cancelTransfer('c1'));
    const updater = setActiveCalls.mock.calls[0][0] as (p: CallSession[]) => CallSession[];
    const mapped = updater(calls);
    expect(mapped[0].status).toBe('active');
    expect(mapped[0].isOnHold).toBe(false);
    expect(mapped[0].isTransferring).toBe(false);
    // non-matching id is unchanged
    const other = [makeCall('other')];
    expect(updater(other)[0]).toBe(other[0]);
  });
});
