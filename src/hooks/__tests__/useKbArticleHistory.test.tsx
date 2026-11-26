import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { supabase } from '@/integrations/supabase/client';
import {
  KB_ARTICLE_HISTORY_COLUMNS,
  kbHistoryActorLabel,
  kbHistoryChangeLabel,
  kbHistoryChangeTone,
  kbHistoryContentChanged,
  kbHistoryPreview,
  kbHistoryTitleChanged,
  useKbArticleHistory,
  type KbArticleHistoryEntry,
} from '@/hooks/useKbArticleHistory';

const state = vi.hoisted(() => ({
  data: [] as unknown,
  error: null as unknown,
  eq: null as null | [string, unknown],
  order: null as null | { column: string; ascending: boolean },
  limit: null as number | null,
}));

vi.mock('@/integrations/supabase/client', () => ({
  __state: state,
  supabase: {
    from: vi.fn(() => {
      const chain: Record<string, unknown> = {};
      chain.select = vi.fn(() => chain);
      chain.eq = vi.fn((column: string, value: unknown) => {
        state.eq = [column, value];
        return chain;
      });
      chain.order = vi.fn((column: string, options: { ascending: boolean }) => {
        state.order = { column, ascending: options.ascending };
        return chain;
      });
      chain.limit = vi.fn((value: number) => {
        state.limit = value;
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

const baseEntry: KbArticleHistoryEntry = {
  id: 'h1',
  article_id: 'a1',
  changed_by: '12345678-90ab-cdef-1234-567890abcdef',
  previous_title: 'Titulo antigo',
  new_title: 'Titulo novo',
  previous_content: 'conteudo antigo',
  new_content: 'conteudo novo',
  change_type: 'update',
  created_at: '2026-11-26T10:00:00.000Z',
};

beforeEach(() => {
  state.data = [];
  state.error = null;
  state.eq = null;
  state.order = null;
  state.limit = null;
  vi.clearAllMocks();
});

describe('useKbArticleHistory', () => {
  it('nao consulta o banco sem artigo selecionado', async () => {
    const { result } = renderHook(() => useKbArticleHistory(null), { wrapper });
    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('filtra por artigo, ordena do mais recente e limita o resultado', async () => {
    state.data = [baseEntry];
    const { result } = renderHook(() => useKbArticleHistory('a1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(supabase.from).toHaveBeenCalledWith('kb_article_history');
    expect(state.eq).toEqual(['article_id', 'a1']);
    expect(state.order).toEqual({ column: 'created_at', ascending: false });
    expect(state.limit).toBe(20);
    expect(result.current.data).toHaveLength(1);
    expect(KB_ARTICLE_HISTORY_COLUMNS).toContain('change_type');
  });

  it('propaga erro de leitura para a tela', async () => {
    state.error = new Error('sem permissao');
    const { result } = renderHook(() => useKbArticleHistory('a1'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('sem permissao');
  });
});

describe('helpers do historico de artigos', () => {
  it('rotula os tipos de alteracao gravados pelo trigger', () => {
    expect(kbHistoryChangeLabel('create')).toBe('Criação');
    expect(kbHistoryChangeLabel('update')).toBe('Edição');
    expect(kbHistoryChangeLabel('status_change')).toBe('Mudança de status');
    expect(kbHistoryChangeLabel('publish')).toBe('Publicação');
    expect(kbHistoryChangeLabel('outro')).toBe('outro');
    expect(kbHistoryChangeLabel(null)).toBe('Alteração');
  });

  it('agrupa os tipos em tons visuais', () => {
    expect(kbHistoryChangeTone('create')).toBe('create');
    expect(kbHistoryChangeTone('status_change')).toBe('status');
    expect(kbHistoryChangeTone('publish')).toBe('status');
    expect(kbHistoryChangeTone('update')).toBe('update');
    expect(kbHistoryChangeTone(null)).toBe('neutral');
  });

  it('detecta mudanca de titulo e de conteudo', () => {
    expect(kbHistoryTitleChanged(baseEntry)).toBe(true);
    expect(kbHistoryTitleChanged({ ...baseEntry, previous_title: null })).toBe(false);
    expect(kbHistoryTitleChanged({ ...baseEntry, previous_title: 'igual', new_title: 'igual' })).toBe(false);
    expect(kbHistoryContentChanged(baseEntry)).toBe(true);
    expect(kbHistoryContentChanged({ ...baseEntry, previous_content: 'x', new_content: 'x' })).toBe(false);
  });

  it('encurta o autor e o texto de pre-visualizacao', () => {
    expect(kbHistoryActorLabel(null)).toBe('por sistema');
    expect(kbHistoryActorLabel('12345678-90ab')).toBe('por 12345678...');
    expect(kbHistoryActorLabel('abc')).toBe('por abc');
    expect(kbHistoryPreview('  linha 1\n\n  linha 2  ')).toBe('linha 1 linha 2');
    expect(kbHistoryPreview(null)).toBe('');
    expect(kbHistoryPreview('abcdefghij', 4)).toBe('abcd...');
  });
});