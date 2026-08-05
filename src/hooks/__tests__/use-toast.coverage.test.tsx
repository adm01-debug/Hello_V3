import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast, toast, reducer } from '../use-toast';

describe('use-toast (coverage)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('adds a toast and exposes state via useToast', () => {
    const { result } = renderHook(() => useToast());
    act(() => { toast({ title: 'Hello', description: 'World' }); });
    expect(result.current.toasts.length).toBeGreaterThan(0);
    expect(result.current.toasts[0].title).toBe('Hello');
  });

  it('dismisses a toast and removes it after delay', () => {
    const { result } = renderHook(() => useToast());
    let handle: { id: string; dismiss: () => void; update: (p: never) => void } | undefined;
    act(() => { handle = toast({ title: 'Bye' }); });
    act(() => { handle!.dismiss(); });
    expect(result.current.toasts.find(t => t.id === handle!.id)?.open).toBe(false);
    act(() => { vi.runOnlyPendingTimers(); });
  });

  it('updates a toast in place', () => {
    const { result } = renderHook(() => useToast());
    let handle: ReturnType<typeof toast> | undefined;
    act(() => { handle = toast({ title: 'Initial' }); });
    act(() => { handle!.update({ id: handle!.id, title: 'Updated' } as never); });
    expect(result.current.toasts[0].title).toBe('Updated');
  });

  it('dismiss() with no id dismisses all', () => {
    const { result } = renderHook(() => useToast());
    act(() => { toast({ title: 'one' }); });
    act(() => { result.current.dismiss(); });
    expect(result.current.toasts.every(t => t.open === false)).toBe(true);
  });

  it('reducer handles ADD/UPDATE/DISMISS/REMOVE', () => {
    let state = reducer({ toasts: [] }, { type: 'ADD_TOAST', toast: { id: '1', open: true } as never });
    expect(state.toasts).toHaveLength(1);
    state = reducer(state, { type: 'UPDATE_TOAST', toast: { id: '1', title: 'x' } as never });
    expect((state.toasts[0] as { title?: string }).title).toBe('x');
    state = reducer(state, { type: 'DISMISS_TOAST', toastId: '1' });
    expect(state.toasts[0].open).toBe(false);
    const removed = reducer(state, { type: 'REMOVE_TOAST', toastId: '1' });
    expect(removed.toasts).toHaveLength(0);
    const removedAll = reducer(state, { type: 'REMOVE_TOAST', toastId: undefined });
    expect(removedAll.toasts).toHaveLength(0);
  });

  it('triggers onOpenChange callback -> dismiss', () => {
    const { result } = renderHook(() => useToast());
    act(() => { toast({ title: 'cb' }); });
    const t = result.current.toasts[0];
    act(() => { t.onOpenChange?.(false); });
    expect(result.current.toasts[0].open).toBe(false);
  });
});
