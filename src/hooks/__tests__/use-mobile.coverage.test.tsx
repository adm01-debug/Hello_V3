import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '../use-mobile';

vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('useIsMobile', () => {
  let changeHandler: (() => void) | null = null;

  beforeEach(() => {
    changeHandler = null;
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: (_: string, cb: () => void) => { changeHandler = cb; },
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('returns false for desktop width', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('returns true for mobile width and reacts to change', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);

    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
    act(() => { changeHandler && changeHandler(); });
    expect(result.current).toBe(false);
  });

  it('cleans up listener on unmount', () => {
    const { unmount } = renderHook(() => useIsMobile());
    expect(() => unmount()).not.toThrow();
  });
});
