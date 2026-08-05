import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTalkRatio } from '@/hooks/useTalkRatio';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

import { supabase } from '@/integrations/supabase/client';

const mockResult = {
  callSessionId: 'c1', totalDuration: 100, agentTalkSeconds: 50, customerTalkSeconds: 50,
  silenceSeconds: 0, agentTalkRatio: 0.5, customerTalkRatio: 0.5, silenceRatio: 0,
  longestAgentMonologueSeconds: 30, longestCustomerMonologueSeconds: 30, interruptions: 0,
  benchmark: { idealAgentRatio: [0.4, 0.6], status: 'optimal' as const },
};

describe('useTalkRatio', () => {
  beforeEach(() => vi.clearAllMocks());

  it('estado inicial é vazio', () => {
    const { result } = renderHook(() => useTalkRatio());
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('analisa com sucesso', async () => {
    (supabase.functions.invoke as Mock).mockResolvedValueOnce({ data: mockResult, error: null });
    const { result } = renderHook(() => useTalkRatio());
    await act(async () => {
      await result.current.analyze('c1', [{ speaker: 'a', start: 0, end: 50 }]);
    });
    await waitFor(() => expect(result.current.data?.benchmark.status).toBe('optimal'));
  });

  it('captura erro do backend', async () => {
    (supabase.functions.invoke as Mock).mockResolvedValueOnce({ data: null, error: new Error('falhou') });
    const { result } = renderHook(() => useTalkRatio());
    await act(async () => { await result.current.analyze('c1', []); });
    await waitFor(() => expect(result.current.error).toBe('falhou'));
    expect(result.current.data).toBeNull();
  });
});
