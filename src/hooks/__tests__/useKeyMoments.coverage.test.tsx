import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useKeyMoments } from '../useKeyMoments';

const momentRows = [
  {
    id: 'km1',
    call_session_id: 'cs1',
    moment_type: 'price',
    timestamp_seconds: 10,
    quote: 'pricing discussion',
    speaker: 'agent',
    confidence: 0.9,
    metadata: {},
    created_at: '',
  },
];

const state = {
  fetchError: null as unknown,
  invokeError: null as unknown,
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => {
      const builder: Record<string, unknown> = {};
      builder.select = vi.fn().mockReturnValue(builder);
      builder.eq = vi.fn().mockReturnValue(builder);
      builder.order = vi.fn().mockResolvedValue({ data: momentRows, error: state.fetchError });
      return builder;
    }),
    functions: {
      invoke: vi.fn(() =>
        Promise.resolve({ data: { detected: 3 }, error: state.invokeError }),
      ),
    },
  },
}));

vi.mock('@/lib/logger', () => {
  const mk = () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() });
  return { logger: { create: vi.fn(mk), ...mk() } };
});
vi.mock('@/lib/tracing', () => ({
  traceHeaders: () => ({ 'x-request-id': 't1' }),
  withTrace: (_op: string, fn: () => unknown) => fn(),
}));

beforeEach(() => {
  state.fetchError = null;
  state.invokeError = null;
});

describe('useKeyMoments', () => {
  it('fetches moments when callSessionId provided', async () => {
    const { result } = renderHook(() => useKeyMoments('cs1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.moments.length).toBe(1);
  });

  it('does not fetch without id', async () => {
    const { result } = renderHook(() => useKeyMoments());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.moments.length).toBe(0);
  });

  it('handles fetch error', async () => {
    state.fetchError = new Error('fetch fail');
    const { result } = renderHook(() => useKeyMoments('cs1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    // On a fetch error the hook recovers gracefully and exposes an array.
    expect(Array.isArray(result.current.moments)).toBe(true);
  });

  it('detect success returns data and refetches', async () => {
    const { result } = renderHook(() => useKeyMoments('cs1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    let out: unknown;
    await act(async () => {
      out = await result.current.detect('cs1', 'transcript text');
    });
    expect(out).toEqual({ detected: 3 });
    expect(result.current.detecting).toBe(false);
  });

  it('detect error returns null', async () => {
    state.invokeError = new Error('invoke fail');
    const { result } = renderHook(() => useKeyMoments('cs1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    let out: unknown = 'x';
    await act(async () => {
      out = await result.current.detect('cs1', 'transcript');
    });
    expect(out).toBeNull();
  });

  it('refetch executes', async () => {
    const { result } = renderHook(() => useKeyMoments('cs1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.refetch();
    });
    expect(result.current.moments.length).toBe(1);
  });
});
