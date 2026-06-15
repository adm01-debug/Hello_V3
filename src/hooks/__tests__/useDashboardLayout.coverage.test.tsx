import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';

const STORAGE_KEY = 'voip-dashboard-layout';

describe('useDashboardLayout', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with default layout when nothing stored', () => {
    const { result } = renderHook(() => useDashboardLayout());
    expect(result.current.layout.length).toBe(8);
    expect(result.current.layout.every((w) => w.visible)).toBe(true);
    expect(result.current.isEditing).toBe(false);
  });

  it('initializes from stored layout', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 'stats', visible: false }]),
    );
    const { result } = renderHook(() => useDashboardLayout());
    expect(result.current.layout).toEqual([{ id: 'stats', visible: false }]);
  });

  it('saves a new layout and persists to localStorage', () => {
    const { result } = renderHook(() => useDashboardLayout());
    const newLayout = [{ id: 'stats' as const, visible: false }];
    act(() => {
      result.current.saveLayout(newLayout);
    });
    expect(result.current.layout).toEqual(newLayout);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(newLayout);
  });

  it('toggles a widget visibility', () => {
    const { result } = renderHook(() => useDashboardLayout());
    act(() => {
      result.current.toggleWidget('stats');
    });
    const stats = result.current.layout.find((w) => w.id === 'stats');
    expect(stats?.visible).toBe(false);
    act(() => {
      result.current.toggleWidget('stats');
    });
    expect(result.current.layout.find((w) => w.id === 'stats')?.visible).toBe(true);
  });

  it('resets layout to default', () => {
    const { result } = renderHook(() => useDashboardLayout());
    act(() => {
      result.current.saveLayout([{ id: 'stats' as const, visible: false }]);
    });
    act(() => {
      result.current.resetLayout();
    });
    expect(result.current.layout.length).toBe(8);
    expect(result.current.layout.every((w) => w.visible)).toBe(true);
  });

  it('updates isEditing', () => {
    const { result } = renderHook(() => useDashboardLayout());
    act(() => {
      result.current.setIsEditing(true);
    });
    expect(result.current.isEditing).toBe(true);
  });
});
