import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnimatedCounter } from '../useAnimatedCounter';

describe('useAnimatedCounter', () => {
  let now = 0;
  let rafCallbacks: FrameRequestCallback[] = [];

  beforeEach(() => {
    now = 0;
    rafCallbacks = [];
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    vi.stubGlobal(
      'requestAnimationFrame',
      (cb: FrameRequestCallback) => {
        rafCallbacks.push(cb);
        return rafCallbacks.length;
      },
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // Drive the RAF loop by repeatedly invoking the latest scheduled callback
  // while advancing the fake clock.
  function flush(times: number, dt: number) {
    act(() => {
      for (let i = 0; i < times; i++) {
        const cb = rafCallbacks.shift();
        if (!cb) break;
        now += dt;
        cb(now);
      }
    });
  }

  it('returns 0 initially and animates toward the end value', () => {
    const { result } = renderHook(() => useAnimatedCounter(100, { duration: 1000 }));
    expect(result.current).toBe(0);
    // advance enough frames to complete the animation
    flush(20, 100);
    expect(result.current).toBe(100);
  });

  it('respects decimals option', () => {
    const { result } = renderHook(() =>
      useAnimatedCounter(10, { duration: 500, decimals: 2 }),
    );
    flush(10, 100);
    expect(result.current).toBeCloseTo(10, 2);
  });

  it('early-returns when diff is zero', () => {
    const { result } = renderHook(() => useAnimatedCounter(0));
    expect(result.current).toBe(0);
    // No RAF should have been scheduled for a zero diff
    expect(rafCallbacks.length).toBe(0);
  });

  it('uses default options when none provided', () => {
    const { result } = renderHook(() => useAnimatedCounter(50));
    flush(30, 100);
    expect(result.current).toBe(50);
  });
});
