import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

type State = {
  data: unknown[];
  error: unknown;
  select: string | null;
  order: { column: string; ascending: boolean } | null;
  limit: number | null;
};

vi.mock('@/integrations/supabase/client', () => {
  const state: State = { data: [], error: null, select: null, order: null, limit: null };
  return {
    __state: state,
    supabase: {
      from: (table: string) => {
        state.select = `table:${table}`;
        return {
          select: (columns: string) => {
            state.select = `${table}|${columns}`;
            return {
              order: (column: string, opts?: { ascending?: boolean }) => {
                state.order = { column, ascending: opts?.ascending ?? true };
                return {
                  limit: (n: number) => {
                    state.limit = n;
                    return Promise.resolve({ data: state.data, error: state.error });
                  },
                };
              },
            };
          },
        };
      },
    },
  };
});

import * as clientModule from '@/integrations/supabase/client';
import {
  useRedactionLog,
  REDACTION_LOG_COLUMNS,
  REDACTION_LOG_LIMIT,
  countRedactionSegments,
  redactionPatternList,
  redactionStatusLabel,
  redactionStatusTone,
} from '@/hooks/useRedactionLog';

const state = (clientModule as unknown as { __state: State }).__state;

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const row = {
  id: 'log-1',
  call_session_id: '11111111-2222-3333-4444-555555555555',
  pattern_type: 'cpf,card',
  match_count: 3,
  segments: [{ start: 0 }],
  status: 'completed',
  error_message: null,
  created_at: '2026-11-26T10:00:00Z',
};

beforeEach(() => {
  state.data = [row];
  state.error = null;
  state.select = null;
  state.order = null;
  state.limit = null;
});

describe('useRedactionLog', () => {
  it('le redaction_log com as colunas esperadas e ordena do mais recente', async () => {
    const { result } = renderHook(() => useRedactionLog(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(state.select).toBe(`redaction_log|${REDACTION_LOG_COLUMNS}`);
    expect(state.order).toEqual({ column: 'created_at', ascending: false });
    expect(state.limit).toBe(REDACTION_LOG_LIMIT);
    expect(result.current.data).toHaveLength(1);
  });

  it('respeita o limite informado', async () => {
    const { result } = renderHook(() => useRedactionLog(5), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(state.limit).toBe(5);
  });

  it('devolve lista vazia quando a tabela nao tem linhas', async () => {
    state.data = [];
    const { result } = renderHook(() => useRedactionLog(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('propaga o erro da leitura (RLS ou rede)', async () => {
    state.error = { message: 'permission denied for table redaction_log' };
    const { result } = renderHook(() => useRedactionLog(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as { message: string }).message).toContain('permission denied');
  });
});

describe('helpers de redaction_log', () => {
  it('rotula e colore cada status conhecido', () => {
    expect(redactionStatusLabel('completed')).toBe('Concluida');
    expect(redactionStatusLabel('no_matches')).toBe('Sem ocorrencias');
    expect(redactionStatusLabel('failed')).toBe('Falhou');
    expect(redactionStatusLabel('desconhecido')).toBe('desconhecido');
    expect(redactionStatusTone('completed')).toBe('success');
    expect(redactionStatusTone('no_matches')).toBe('neutral');
    expect(redactionStatusTone('failed')).toBe('danger');
    expect(redactionStatusTone('qualquer')).toBe('danger');
  });

  it('quebra pattern_type em lista e ignora "none" e vazios', () => {
    expect(redactionPatternList('cpf, card')).toEqual(['cpf', 'card']);
    expect(redactionPatternList('none')).toEqual([]);
    expect(redactionPatternList('')).toEqual([]);
    expect(redactionPatternList('cpf,,card, ')).toEqual(['cpf', 'card']);
  });

  it('conta segmentos apenas quando e array', () => {
    expect(countRedactionSegments([{ a: 1 }, { b: 2 }])).toBe(2);
    expect(countRedactionSegments([])).toBe(0);
    expect(countRedactionSegments(null)).toBe(0);
    expect(countRedactionSegments({ a: 1 })).toBe(0);
    expect(countRedactionSegments('texto')).toBe(0);
  });
});