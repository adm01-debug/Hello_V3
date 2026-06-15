import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useLiveSentiment, type SentimentSnapshot } from '../useLiveSentiment';

const insert = vi.fn();
const order = vi.fn();
const eq = vi.fn(() => ({ order }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ insert, select }));

const on = vi.fn();
const subscribe = vi.fn();
const channelObj = { on, subscribe };
const channel = vi.fn(() => channelObj);
const removeChannel = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...a: unknown[]) => (from as (...args: unknown[]) => unknown)(...a),
    channel: (...a: unknown[]) => (channel as (...args: unknown[]) => unknown)(...a),
    removeChannel: (...a: unknown[]) => (removeChannel as (...args: unknown[]) => unknown)(...a),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
  on.mockReturnValue(channelObj);
  subscribe.mockReturnValue(channelObj);
  order.mockResolvedValue({ data: [{ id: 's1', call_session_id: 'call-1', timestamp_seconds: 1, sentiment: 'positive', score: 0.9, urgency: 'low', emotion: 'happy', created_at: 'now' }], error: null });
  if (!('randomUUID' in globalThis.crypto)) {
    Object.defineProperty(globalThis.crypto, 'randomUUID', { value: () => 'uuid-1', configurable: true });
  } else {
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('uuid-1-1-1-1-1');
  }
});

const base: Omit<SentimentSnapshot, 'id' | 'created_at'> = {
  call_session_id: 'call-1',
  timestamp_seconds: 5,
  sentiment: 'neutral',
  score: 0.5,
  urgency: 'medium',
  emotion: null,
};

describe('useLiveSentiment', () => {
  it('does nothing without callSessionId', () => {
    const { result } = renderHook(() => useLiveSentiment(undefined));
    expect(result.current.snapshots).toEqual([]);
    expect(channel).not.toHaveBeenCalled();
  });

  it('loads snapshots and subscribes to realtime channel', async () => {
    const { result, unmount } = renderHook(() => useLiveSentiment('call-1'));
    await waitFor(() => expect(result.current.snapshots.length).toBe(1));
    expect(channel).toHaveBeenCalledWith('sentiment-call-1');
    expect(on).toHaveBeenCalled();
    expect(subscribe).toHaveBeenCalled();

    // exercise the realtime INSERT callback
    const handler = on.mock.calls[0][2] as (payload: { new: unknown }) => void;
    act(() => handler({ new: { id: 's2', call_session_id: 'call-1', timestamp_seconds: 2, sentiment: 'negative', score: 0.1, urgency: 'high', emotion: null, created_at: 'now' } }));
    await waitFor(() => expect(result.current.snapshots.length).toBe(2));

    unmount();
    expect(removeChannel).toHaveBeenCalledWith(channelObj);
  });

  it('handles null data from initial load', async () => {
    order.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => useLiveSentiment('call-1'));
    await waitFor(() => expect(channel).toHaveBeenCalled());
    expect(result.current.snapshots).toEqual([]);
  });

  it('recordSnapshot appends on success', async () => {
    insert.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useLiveSentiment('call-1'));
    await waitFor(() => expect(result.current.snapshots.length).toBe(1));
    await act(async () => {
      await result.current.recordSnapshot(base);
    });
    expect(insert).toHaveBeenCalled();
    expect(result.current.snapshots.length).toBe(2);
  });

  it('recordSnapshot does not append on error', async () => {
    insert.mockResolvedValue({ error: { message: 'fail' } });
    const { result } = renderHook(() => useLiveSentiment('call-1'));
    await waitFor(() => expect(result.current.snapshots.length).toBe(1));
    await act(async () => {
      await result.current.recordSnapshot(base);
    });
    expect(result.current.snapshots.length).toBe(1);
  });
});
