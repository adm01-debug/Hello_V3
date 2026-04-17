import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useMeetingSummary } from '../useMeetingSummary';

const invokeMock = vi.fn();
const fromMock = vi.fn();
const channelObj: any = {};
channelObj.on = vi.fn(() => channelObj);
channelObj.subscribe = vi.fn(() => channelObj);

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...a: any[]) => fromMock(...a),
    functions: { invoke: (...a: any[]) => invokeMock(...a) },
    channel: vi.fn(() => channelObj),
    removeChannel: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const { toast } = await import('sonner');

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
}

function makeQuery(rowData: any) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: rowData, error: null }),
    update: vi.fn().mockReturnThis(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useMeetingSummary - parse', () => {
  it('normaliza arrays nulos para []', async () => {
    fromMock.mockReturnValue(
      makeQuery({
        id: 'a',
        call_session_id: 'cs',
        summary: 'ok',
        key_points: null,
        action_items: null,
        decisions: undefined,
        next_steps: 'invalido' as any,
        participants_sentiment: null,
        topics_discussed: null,
        shared_with: null,
        status: 'completed',
      })
    );
    const { result } = renderHook(() => useMeetingSummary('cs'), { wrapper });
    await waitFor(() => expect(result.current.summary).toBeTruthy());
    expect(result.current.summary?.key_points).toEqual([]);
    expect(result.current.summary?.action_items).toEqual([]);
    expect(result.current.summary?.decisions).toEqual([]);
    expect(result.current.summary?.next_steps).toEqual([]);
    expect(result.current.summary?.participants_sentiment).toEqual([]);
  });
});

describe('useMeetingSummary - generate', () => {
  it('sucesso → toast.success', async () => {
    fromMock.mockReturnValue(makeQuery(null));
    invokeMock.mockResolvedValue({ data: { success: true }, error: null });
    const { result } = renderHook(() => useMeetingSummary('cs'), { wrapper });
    await act(async () => {
      result.current.generate();
      await new Promise((r) => setTimeout(r, 0));
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Resumo gerado pela IA'));
  });

  it('skipped → toast.info', async () => {
    fromMock.mockReturnValue(makeQuery(null));
    invokeMock.mockResolvedValue({ data: { skipped: true }, error: null });
    const { result } = renderHook(() => useMeetingSummary('cs'), { wrapper });
    await act(async () => {
      result.current.generate();
      await new Promise((r) => setTimeout(r, 0));
    });
    await waitFor(() => expect(toast.info).toHaveBeenCalledWith('Resumo já existente'));
  });

  it('erro → toast.error', async () => {
    fromMock.mockReturnValue(makeQuery(null));
    invokeMock.mockResolvedValue({ data: null, error: { message: 'falhou' } });
    const { result } = renderHook(() => useMeetingSummary('cs'), { wrapper });
    await act(async () => {
      result.current.generate();
      await new Promise((r) => setTimeout(r, 0));
    });
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});
