import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const invokeMock = vi.fn();
const removeChannelMock = vi.fn();
const subscribeMock = vi.fn();
const updateEqMock = vi.fn();

// table -> resolved result
const results: Record<string, { data: unknown[] | null; error: unknown }> = {};

vi.mock('@/integrations/supabase/client', () => {
  const makeChain = (table: string) => {
    const resolved = () => Promise.resolve(results[table] ?? { data: [], error: null });
    const chain: Record<string, unknown> = {};
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
    chain.order = vi.fn(() => chain);
    chain.limit = vi.fn(() => resolved());
    chain.update = vi.fn(() => ({ eq: (...a: unknown[]) => { updateEqMock(...a); return Promise.resolve({ error: null }); } }));
    chain.then = (cb: (v: unknown) => unknown) => resolved().then(cb);
    return chain;
  };
  return {
    supabase: {
      from: vi.fn((table: string) => makeChain(table)),
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: (...a: unknown[]) => { subscribeMock(...a); return {}; },
      })),
      removeChannel: (...a: unknown[]) => removeChannelMock(...a),
      functions: { invoke: (...a: unknown[]) => invokeMock(...a) },
    },
  };
});

vi.mock('@/lib/logger', () => ({
  logger: {
    create: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  },
}));

import { useLiveAssist, useAgentAssistHistory } from '@/hooks/useLiveAssist';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of Object.keys(results)) delete results[k];
  invokeMock.mockResolvedValue({ data: {}, error: null });
});

describe('useLiveAssist', () => {
  it('is disabled (no fetch) without callSessionId', async () => {
    const { result } = renderHook(() => useLiveAssist(), { wrapper });
    expect(result.current.signals).toEqual([]);
    // analyze returns early when no session
    await act(async () => { await result.current.analyze({ latestUtterance: 'hi there' }); });
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('loads signals and subscribes to realtime when callSessionId present', async () => {
    results.live_assist_signals = {
      data: [{ id: 's1', call_session_id: 'cs1', intent: 'objection', confidence: 0.8 }],
      error: null,
    };
    const { result } = renderHook(() => useLiveAssist('cs1'), { wrapper });
    await waitFor(() => expect(result.current.signals.length).toBe(1));
    expect(subscribeMock).toHaveBeenCalled();
  });

  it('analyze invokes edge function when throttle allows', async () => {
    results.live_assist_signals = { data: [], error: null };
    const { result } = renderHook(() => useLiveAssist('cs1'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // 30+ words to exceed MIN_NEW_WORDS
    const utterance = Array.from({ length: 35 }, (_, i) => `word${i}`).join(' ');
    await act(async () => { await result.current.analyze({ latestUtterance: utterance, speaker: 'agent' }); });
    expect(invokeMock).toHaveBeenCalledWith('analyze-live-utterance', expect.anything());
  });

  it('analyze skips when throttle not met (short utterance after recent analysis)', async () => {
    results.live_assist_signals = { data: [], error: null };
    const { result } = renderHook(() => useLiveAssist('cs1'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // First call sets lastAnalysisAt and lastWordCount high
    const long = Array.from({ length: 40 }, (_, i) => `w${i}`).join(' ');
    await act(async () => { await result.current.analyze({ latestUtterance: long }); });
    invokeMock.mockClear();
    // Second call immediately with fewer words -> elapsed < throttle and newWords negative
    await act(async () => { await result.current.analyze({ latestUtterance: 'short text' }); });
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('analyze swallows edge function errors', async () => {
    results.live_assist_signals = { data: [], error: null };
    invokeMock.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useLiveAssist('cs1'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const utterance = Array.from({ length: 35 }, (_, i) => `word${i}`).join(' ');
    await act(async () => { await result.current.analyze({ latestUtterance: utterance }); });
    expect(result.current.isAnalyzing).toBe(false);
  });

  it('markUsed updates the signal', async () => {
    results.live_assist_signals = { data: [], error: null };
    const { result } = renderHook(() => useLiveAssist('cs1'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.markUsed('sig1'); });
    expect(updateEqMock).toHaveBeenCalledWith('id', 'sig1');
  });

  it('unsubscribes on unmount', async () => {
    results.live_assist_signals = { data: [], error: null };
    const { result, unmount } = renderHook(() => useLiveAssist('cs1'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    unmount();
    expect(removeChannelMock).toHaveBeenCalled();
  });
});

describe('useAgentAssistHistory', () => {
  it('loads history without filters', async () => {
    results.live_assist_signals = { data: [{ id: 'h1' }], error: null };
    const { result } = renderHook(() => useAgentAssistHistory(), { wrapper });
    await waitFor(() => expect(result.current.data?.length).toBe(1));
  });

  it('applies agentName and intent filters', async () => {
    const eqMock = vi.fn().mockReturnThis();
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      eq: eqMock,
      then: (cb: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(cb),
    };
    const { supabase } = await import('@/integrations/supabase/client');
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(chain as never);
    const { result } = renderHook(
      () => useAgentAssistHistory({ agentName: 'Alice', intent: 'objection', limit: 20 }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(eqMock).toHaveBeenCalledWith('agent_name', 'Alice');
    expect(eqMock).toHaveBeenCalledWith('intent', 'objection');
  });
});
