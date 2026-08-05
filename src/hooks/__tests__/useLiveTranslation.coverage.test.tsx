import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock('@/lib/logger', () => {
  const lvl = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  return {
    logger: { create: vi.fn(() => lvl), ...lvl },
    generateRequestId: vi.fn(() => 'trace-id'),
    setRequestId: vi.fn(),
    clearRequestId: vi.fn(),
    getRequestId: vi.fn(() => 'trace-id'),
  };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: h.invokeMock },
  },
}));

import { useLiveTranslation } from '@/hooks/useLiveTranslation';

beforeEach(() => {
  vi.clearAllMocks();
  h.invokeMock.mockResolvedValue({ data: { translated: 'hello world', latency_ms: 42 }, error: null });
  if (!globalThis.crypto) {
    (globalThis as unknown as Record<string, unknown>).crypto = {};
  }
  if (!globalThis.crypto.randomUUID) {
    (globalThis.crypto as unknown as { randomUUID: () => string }).randomUUID = () =>
      'uuid-' + Math.random().toString(36).slice(2);
  }
});

describe('useLiveTranslation', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() =>
      useLiveTranslation({ callSessionId: 'cs1', targetLang: 'en' }),
    );
    expect(result.current.segments).toEqual([]);
    expect(result.current.isTranslating).toBe(false);
  });

  it('does nothing without callSessionId or empty text', async () => {
    const { result } = renderHook(() => useLiveTranslation({ targetLang: 'en' }));
    await act(async () => {
      await result.current.translate('hello there how are you', 'agent');
    });
    await act(async () => {
      await result.current.translate('   ', 'agent');
    });
    expect(h.invokeMock).not.toHaveBeenCalled();
  });

  it('queues short utterances below minWords without invoking', async () => {
    const { result } = renderHook(() =>
      useLiveTranslation({ callSessionId: 'cs1', targetLang: 'en', minWords: 4 }),
    );
    await act(async () => {
      await result.current.translate('hi there', 'agent');
    });
    expect(h.invokeMock).not.toHaveBeenCalled();
  });

  it('translates and adds a segment on success', async () => {
    const { result } = renderHook(() =>
      useLiveTranslation({ callSessionId: 'cs1', targetLang: 'en', minWords: 2 }),
    );
    await act(async () => {
      await result.current.translate('bom dia tudo bem com voce', 'customer');
    });
    await waitFor(() => expect(result.current.segments.length).toBe(1));
    expect(h.invokeMock).toHaveBeenCalledWith(
      'translate-utterance',
      expect.objectContaining({ body: expect.objectContaining({ speaker: 'customer' }) }),
    );
    expect(result.current.segments[0].translated).toBe('hello world');
    expect(result.current.segments[0].latencyMs).toBe(42);
    expect(result.current.isTranslating).toBe(false);
  });

  it('skips when already in the target language with high confidence', async () => {
    const { result } = renderHook(() =>
      useLiveTranslation({ callSessionId: 'cs1', targetLang: 'pt', minWords: 2 }),
    );
    await act(async () => {
      await result.current.translate('não com para você está obrigado bom dia', 'agent');
    });
    expect(h.invokeMock).not.toHaveBeenCalled();
  });

  it('throttles rapid consecutive calls', async () => {
    const { result } = renderHook(() =>
      useLiveTranslation({ callSessionId: 'cs1', targetLang: 'en', minWords: 2, throttleMs: 100000 }),
    );
    await act(async () => {
      await result.current.translate('bom dia tudo bem com voce', 'customer');
    });
    await waitFor(() => expect(result.current.segments.length).toBe(1));
    // Second call within throttle window -> skipped
    await act(async () => {
      await result.current.translate('outra frase longa para traduzir agora', 'customer');
    });
    expect(h.invokeMock).toHaveBeenCalledTimes(1);
  });

  it('handles invoke error', async () => {
    h.invokeMock.mockResolvedValue({ data: null, error: { message: 'boom' } });
    const { result } = renderHook(() =>
      useLiveTranslation({ callSessionId: 'cs1', targetLang: 'en', minWords: 2 }),
    );
    await act(async () => {
      await result.current.translate('bom dia tudo bem com voce', 'customer');
    });
    await waitFor(() => expect(result.current.isTranslating).toBe(false));
    expect(result.current.segments).toEqual([]);
  });

  it('does not add a segment when data has no translated field', async () => {
    h.invokeMock.mockResolvedValue({ data: {}, error: null });
    const { result } = renderHook(() =>
      useLiveTranslation({ callSessionId: 'cs1', targetLang: 'en', minWords: 2 }),
    );
    await act(async () => {
      await result.current.translate('bom dia tudo bem com voce', 'customer');
    });
    await waitFor(() => expect(result.current.isTranslating).toBe(false));
    expect(result.current.segments).toEqual([]);
  });

  it('reset clears segments and internal refs', async () => {
    const { result } = renderHook(() =>
      useLiveTranslation({ callSessionId: 'cs1', targetLang: 'en', minWords: 2 }),
    );
    await act(async () => {
      await result.current.translate('bom dia tudo bem com voce', 'customer');
    });
    await waitFor(() => expect(result.current.segments.length).toBe(1));
    act(() => {
      result.current.reset();
    });
    expect(result.current.segments).toEqual([]);
  });
});
