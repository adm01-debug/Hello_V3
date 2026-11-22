import { describe, it, expect, vi } from 'vitest';
import {
  startNavigation,
  finishNavigation,
  isNavigating,
  subscribeNavigation,
} from '../navigation-progress-store';

describe('navigation-progress-store', () => {
  it('starts idle', () => {
    expect(isNavigating()).toBe(false);
  });

  it('reports loading between start and finish and notifies subscribers', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeNavigation(listener);

    startNavigation();
    expect(isNavigating()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);

    finishNavigation();
    expect(isNavigating()).toBe(false);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    startNavigation();
    expect(listener).toHaveBeenCalledTimes(2);
    finishNavigation();
  });

  it('only stops loading when every concurrent navigation finished', () => {
    startNavigation();
    startNavigation();
    finishNavigation();
    expect(isNavigating()).toBe(true);
    finishNavigation();
    expect(isNavigating()).toBe(false);
  });

  it('never goes negative when finishing without a start', () => {
    finishNavigation();
    finishNavigation();
    expect(isNavigating()).toBe(false);
    startNavigation();
    expect(isNavigating()).toBe(true);
    finishNavigation();
  });
});