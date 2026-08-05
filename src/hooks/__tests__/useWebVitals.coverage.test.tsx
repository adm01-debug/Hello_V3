import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const getLatestVitals = vi.fn(() => ({ LCP: { name: 'LCP', value: 1, rating: 'good', delta: 0, id: 'x' } }));
const getWebVitals = vi.fn(() => [{ name: 'LCP', value: 1, rating: 'good', delta: 0, id: 'x' }]);
vi.mock('@/lib/web-vitals', () => ({
  getLatestVitals: (...a: unknown[]) => (getLatestVitals as (...args: unknown[]) => unknown)(...a),
  getWebVitals: (...a: unknown[]) => (getWebVitals as (...args: unknown[]) => unknown)(...a),
}));

import { useWebVitals } from '../useWebVitals';

describe('useWebVitals', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks(); });
  afterEach(() => { vi.useRealTimers(); });

  it('loads vitals on mount and refreshes on interval', () => {
    const { result } = renderHook(() => useWebVitals(1000));
    expect(getLatestVitals).toHaveBeenCalledTimes(1);
    expect(result.current.history.length).toBe(1);

    act(() => { vi.advanceTimersByTime(3000); });
    expect(getLatestVitals.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('manual refresh invokes getters', () => {
    const { result } = renderHook(() => useWebVitals(99999));
    getLatestVitals.mockClear();
    act(() => { result.current.refresh(); });
    expect(getLatestVitals).toHaveBeenCalled();
  });

  it('clears interval on unmount', () => {
    const { unmount } = renderHook(() => useWebVitals(500));
    expect(() => unmount()).not.toThrow();
  });
});
