import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCallTimers } from '../useCallTimers';
import type { CallSession } from '../useMultiChannelCall';

function makeCall(over: Partial<CallSession> = {}): CallSession {
  return {
    id: 'call1',
    duration: 0,
    isOnHold: false,
    totalHoldTime: 0,
    ...(over as object),
  } as unknown as CallSession;
}

describe('useCallTimers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('startDurationTimer increments duration each second', () => {
    let calls: CallSession[] = [makeCall()];
    const setActiveCalls = vi.fn((updater: (prev: CallSession[]) => CallSession[]) => {
      calls = updater(calls);
    }) as unknown as React.Dispatch<React.SetStateAction<CallSession[]>>;

    const { result } = renderHook(() => useCallTimers(setActiveCalls));
    act(() => result.current.startDurationTimer('call1'));
    act(() => vi.advanceTimersByTime(3000));
    expect(calls[0].duration).toBe(3);
  });

  it('startDurationTimer clears existing timer when restarted', () => {
    let calls: CallSession[] = [makeCall()];
    const setActiveCalls = vi.fn((updater: (prev: CallSession[]) => CallSession[]) => {
      calls = updater(calls);
    }) as unknown as React.Dispatch<React.SetStateAction<CallSession[]>>;
    const { result } = renderHook(() => useCallTimers(setActiveCalls));
    act(() => result.current.startDurationTimer('call1'));
    act(() => result.current.startDurationTimer('call1')); // restart -> clears existing
    act(() => vi.advanceTimersByTime(1000));
    expect(calls[0].duration).toBe(1);
  });

  it('stopDurationTimer stops increments', () => {
    let calls: CallSession[] = [makeCall()];
    const setActiveCalls = vi.fn((updater: (prev: CallSession[]) => CallSession[]) => {
      calls = updater(calls);
    }) as unknown as React.Dispatch<React.SetStateAction<CallSession[]>>;
    const { result } = renderHook(() => useCallTimers(setActiveCalls));
    act(() => result.current.startDurationTimer('call1'));
    act(() => vi.advanceTimersByTime(1000));
    act(() => result.current.stopDurationTimer('call1'));
    act(() => vi.advanceTimersByTime(5000));
    expect(calls[0].duration).toBe(1);
  });

  it('stopDurationTimer no-op for unknown id', () => {
    const setActiveCalls = vi.fn() as unknown as React.Dispatch<React.SetStateAction<CallSession[]>>;
    const { result } = renderHook(() => useCallTimers(setActiveCalls));
    act(() => result.current.stopDurationTimer('nope'));
    expect(setActiveCalls).not.toHaveBeenCalled();
  });

  it('startHoldTimer increments totalHoldTime only when onHold', () => {
    let calls: CallSession[] = [makeCall({ isOnHold: true })];
    const setActiveCalls = vi.fn((updater: (prev: CallSession[]) => CallSession[]) => {
      calls = updater(calls);
    }) as unknown as React.Dispatch<React.SetStateAction<CallSession[]>>;
    const { result } = renderHook(() => useCallTimers(setActiveCalls));
    act(() => result.current.startHoldTimer('call1'));
    act(() => result.current.startHoldTimer('call1')); // restart path
    act(() => vi.advanceTimersByTime(2000));
    expect(calls[0].totalHoldTime).toBe(2);
  });

  it('startHoldTimer does not increment when not onHold', () => {
    let calls: CallSession[] = [makeCall({ isOnHold: false })];
    const setActiveCalls = vi.fn((updater: (prev: CallSession[]) => CallSession[]) => {
      calls = updater(calls);
    }) as unknown as React.Dispatch<React.SetStateAction<CallSession[]>>;
    const { result } = renderHook(() => useCallTimers(setActiveCalls));
    act(() => result.current.startHoldTimer('call1'));
    act(() => vi.advanceTimersByTime(2000));
    expect(calls[0].totalHoldTime).toBe(0);
  });

  it('stopHoldTimer stops and no-op for unknown', () => {
    let calls: CallSession[] = [makeCall({ isOnHold: true })];
    const setActiveCalls = vi.fn((updater: (prev: CallSession[]) => CallSession[]) => {
      calls = updater(calls);
    }) as unknown as React.Dispatch<React.SetStateAction<CallSession[]>>;
    const { result } = renderHook(() => useCallTimers(setActiveCalls));
    act(() => result.current.startHoldTimer('call1'));
    act(() => result.current.stopHoldTimer('call1'));
    act(() => result.current.stopHoldTimer('unknown'));
    act(() => vi.advanceTimersByTime(2000));
    expect(calls[0].totalHoldTime).toBe(0);
  });

  it('stopAllTimers clears every timer', () => {
    let calls: CallSession[] = [makeCall({ isOnHold: true })];
    const setActiveCalls = vi.fn((updater: (prev: CallSession[]) => CallSession[]) => {
      calls = updater(calls);
    }) as unknown as React.Dispatch<React.SetStateAction<CallSession[]>>;
    const { result } = renderHook(() => useCallTimers(setActiveCalls));
    act(() => result.current.startDurationTimer('call1'));
    act(() => result.current.startHoldTimer('call1'));
    act(() => result.current.stopAllTimers());
    act(() => vi.advanceTimersByTime(5000));
    expect(calls[0].duration).toBe(0);
    expect(calls[0].totalHoldTime).toBe(0);
  });
});
