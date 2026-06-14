import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePageTitle } from '../usePageTitle';

describe('usePageTitle', () => {
  it('sets document title with app name suffix', () => {
    renderHook(() => usePageTitle('Dashboard'));
    expect(document.title).toBe('Dashboard | VoIP Panel');
  });

  it('resets title on unmount', () => {
    const { unmount } = renderHook(() => usePageTitle('Reports'));
    expect(document.title).toBe('Reports | VoIP Panel');
    unmount();
    expect(document.title).toBe('VoIP Panel');
  });

  it('updates title when prop changes', () => {
    const { rerender } = renderHook(({ t }: { t: string }) => usePageTitle(t), {
      initialProps: { t: 'A' },
    });
    expect(document.title).toBe('A | VoIP Panel');
    rerender({ t: 'B' });
    expect(document.title).toBe('B | VoIP Panel');
  });
});
