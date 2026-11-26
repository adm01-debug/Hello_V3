import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { supabase } from '@/integrations/supabase/client';
import {
  DEAL_PIPELINE_TREND_COLUMNS,
  pipelineTrendBarHeight,
  pipelineTrendDeltaPercent,
  pipelineTrendDeltaTone,
  pipelineTrendStartDate,
  useDealPipelineTrend,
  type DealPipelineSnapshot,
} from '@/hooks/useDealPipelineTrend';

const state = vi.hoisted(() => ({
  data: [] as unknown,
  error: null as unknown,
  gte: null as null | [string, string],
  order: null as null | { column: string; ascending: boolean },
}));

vi.mock('@/integrations/supabase/client', () => ({
  __state: state,
  supabase: {
    from: vi.fn(() => {
      const chain: Record<string, unknown> = {};
      chain.select = vi.fn(() => chain);
      chain.gte = vi.fn((column: string, value: string) => {
        state.gte = [column, value];
        return chain;
      });
      chain.order = vi.fn((column: string, options: { ascending: boolean }) => {
        state.order = { column, ascending: options.ascending };
        return Promise.resolve({ data: state.data, error: state.error });
      });
      return chain;
    }),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

const rows: DealPipelineSnapshot[] = [
  { snapshot_date: '2026-11-20', open_count: 10, total_value_cents: 1_000_000, weighted_value_cents: 400_000 },
  { snapshot_date: '2026-11-26', open_count: 12, total_value_cents: 1_200_000, weighted_value_cents: 500_000 },
];

beforeEach(() => {
  state.data = [];
  state.error = null;
  state.gte = null;
  state.order = null;
  vi.clearAllMocks();
});

describe('useDealPipelineTrend', () => {
  it('le a tabela de retratos filtrando pelo inicio do periodo e em ordem cronologica', async () => {
    state.data = rows;
    const { result } = renderHook(() => useDealPipelineTrend(30), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(supabase.from).toHaveBeenCalledWith('deal_pipeline_snapshots');
    expect(state.gte).toEqual(['snapshot_date', pipelineTrendStartDate(30)]);
    expect(state.order).toEqual({ column: 'snapshot_date', ascending: true });
    expect(result.current.data).toHaveLength(2);
    expect(DEAL_PIPELINE_TREND_COLUMNS).toContain('weighted_value_cents');
  });

  it('usa periodo de 7 dias por escolha da tela', async () => {
    const { result } = renderHook(() => useDealPipelineTrend(7), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(state.gte?.[1]).toBe(pipelineTrendStartDate(7));
  });

  it('propaga erro de leitura para a tela', async () => {
    state.error = new Error('sem permissao');
    const { result } = renderHook(() => useDealPipelineTrend(30), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('sem permissao');
  });
});

describe('helpers da tendencia do pipeline', () => {
  it('calcula a data inicial incluindo o dia de hoje', () => {
    const now = new Date('2026-11-26T12:00:00.000Z');
    expect(pipelineTrendStartDate(7, now)).toBe('2026-11-20');
    expect(pipelineTrendStartDate(1, now)).toBe('2026-11-26');
  });

  it('calcula variacao percentual com base zero', () => {
    expect(pipelineTrendDeltaPercent(120, 100)).toBe(20);
    expect(pipelineTrendDeltaPercent(80, 100)).toBe(-20);
    expect(pipelineTrendDeltaPercent(0, 0)).toBe(0);
    expect(pipelineTrendDeltaPercent(50, 0)).toBe(100);
  });

  it('classifica o tom da variacao', () => {
    expect(pipelineTrendDeltaTone(1)).toBe('up');
    expect(pipelineTrendDeltaTone(-0.5)).toBe('down');
    expect(pipelineTrendDeltaTone(0)).toBe('flat');
  });

  it('limita a altura das barras entre 4% e 100%', () => {
    expect(pipelineTrendBarHeight(0, 0)).toBe(0);
    expect(pipelineTrendBarHeight(1, 1000)).toBe(4);
    expect(pipelineTrendBarHeight(500, 1000)).toBe(50);
    expect(pipelineTrendBarHeight(1000, 1000)).toBe(100);
  });
});