import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCallPlaylists, usePlaylistItems } from '../useCallPlaylists';

const fromMock = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...a: unknown[]) => fromMock(...a) },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));

describe('useCallPlaylists (coverage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockReturnValue({
      select: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [{ id: 'pl1' }], error: null }) })),
      insert: vi.fn().mockResolvedValue({ error: null }),
    });
  });

  it('loads playlists on mount', async () => {
    const { result } = renderHook(() => useCallPlaylists());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.playlists).toHaveLength(1);
  });

  it('handles list error', async () => {
    fromMock.mockReturnValue({ select: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: null, error: new Error('x') }) })) });
    const { result } = renderHook(() => useCallPlaylists());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.playlists).toEqual([]);
  });

  it('createPlaylist success and error', async () => {
    const { result } = renderHook(() => useCallPlaylists());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.createPlaylist({ name: 'P' }); });
    expect(ok).toBe(true);

    fromMock.mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: new Error('ins') }) });
    let bad: boolean | undefined;
    await act(async () => { bad = await result.current.createPlaylist({ name: 'P' }); });
    expect(bad).toBe(false);
  });

  it('addItem success and error', async () => {
    const { result } = renderHook(() => useCallPlaylists());
    await waitFor(() => expect(result.current.loading).toBe(false));
    fromMock.mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: null }) });
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.addItem('pl1', 'cs1', 'note'); });
    expect(ok).toBe(true);

    fromMock.mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: new Error('add') }) });
    let bad: boolean | undefined;
    await act(async () => { bad = await result.current.addItem('pl1', 'cs1'); });
    expect(bad).toBe(false);
  });
});

describe('usePlaylistItems (coverage)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty when no playlistId', async () => {
    const { result } = renderHook(() => usePlaylistItems(undefined));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([]);
  });

  it('loads items for a playlist', async () => {
    fromMock.mockReturnValue({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn(() => ({ then: (cb: (r: { data: unknown[]; error: null }) => void) => cb({ data: [{ id: 'it1' }], error: null }) })) })) })),
    });
    const { result } = renderHook(() => usePlaylistItems('pl1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(1);
  });

  it('handles item load error', async () => {
    fromMock.mockReturnValue({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn(() => ({ then: (cb: (r: { data: null; error: Error }) => void) => cb({ data: null, error: new Error('e') }) })) })) })),
    });
    const { result } = renderHook(() => usePlaylistItems('pl1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([]);
  });
});
