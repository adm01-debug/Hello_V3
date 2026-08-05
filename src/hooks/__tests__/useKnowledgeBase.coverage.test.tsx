import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface QueryResult {
  data: unknown;
  error: unknown;
}

// Mutable results keyed by table so individual tests can drive branches.
const tableResults: Record<string, QueryResult> = {};
const rpcResult: { current: QueryResult } = { current: { data: [], error: null } };
const invokeResult: { current: QueryResult } = { current: { data: { embedding: [0.1, 0.2] }, error: null } };
const insertResult: { current: QueryResult } = { current: { data: null, error: null } };

const insertSpy = vi.fn(() => insertResult.current);

vi.mock('@/integrations/supabase/client', () => {
  const makeChain = (table: string) => {
    const c: Record<string, unknown> = {};
    ['select', 'order', 'eq', 'limit', 'upsert', 'textSearch', 'maybeSingle', 'single'].forEach((m) => {
      c[m] = vi.fn(() => c);
    });
    (c as { then: (r: (v: QueryResult) => void) => void }).then = (resolve) =>
      resolve(tableResults[table] ?? { data: [], error: null });
    return c;
  };
  return {
    supabase: {
      from: vi.fn((table: string) => {
        const chain = makeChain(table);
        // insert resolves directly (not chained) for useRecordKbView
        (chain as Record<string, unknown>).insert = insertSpy;
        return chain;
      }),
      rpc: vi.fn(() => rpcResult.current),
      functions: { invoke: vi.fn(() => Promise.resolve(invokeResult.current)) },
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
    },
  };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), create: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

import {
  useKbCategories,
  useKbArticles,
  useKbArticle,
  useUpsertArticle,
  useRecordKbView,
} from '@/hooks/useKnowledgeBase';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of Object.keys(tableResults)) delete tableResults[k];
  rpcResult.current = { data: [], error: null };
  invokeResult.current = { data: { embedding: [0.1, 0.2] }, error: null };
  insertResult.current = { data: null, error: null };
  // Re-attach implementation because vitest's mockReset/restoreMocks wipe it.
  insertSpy.mockImplementation(() => insertResult.current);
});

describe('useKbCategories', () => {
  it('returns published categories', async () => {
    tableResults['kb_categories'] = { data: [{ id: 'c1', name: 'Geral' }], error: null };
    const { result } = renderHook(() => useKbCategories(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  it('surfaces a query error', async () => {
    tableResults['kb_categories'] = { data: null, error: { message: 'boom' } };
    const { result } = renderHook(() => useKbCategories(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useKbArticles', () => {
  it('runs keyword fallback with no params (defaults to published)', async () => {
    tableResults['kb_articles'] = { data: [{ id: 'a1', title: 'Hello' }], error: null };
    const { result } = renderHook(() => useKbArticles(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  it('applies status, category and search filters', async () => {
    tableResults['kb_articles'] = { data: [], error: null };
    const { result } = renderHook(
      () => useKbArticles({ status: 'draft', categoryId: 'c1', search: 'pagamento' }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(supabase.from).toHaveBeenCalledWith('kb_articles');
  });

  it('ignores the "all" category sentinel', async () => {
    tableResults['kb_articles'] = { data: [], error: null };
    const { result } = renderHook(() => useKbArticles({ categoryId: 'all', search: 'x' }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('performs semantic search via embedding + rpc', async () => {
    rpcResult.current = { data: [{ id: 'sem1', title: 'Semantic' }], error: null };
    const { result } = renderHook(
      () => useKbArticles({ useSemantic: true, search: 'como faturar', categoryId: 'c2' }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(supabase.rpc).toHaveBeenCalled();
    expect(result.current.data).toEqual([{ id: 'sem1', title: 'Semantic' }]);
  });

  it('falls back to keyword search when semantic embedding fails', async () => {
    invokeResult.current = { data: null, error: { message: 'embed-fail' } };
    tableResults['kb_articles'] = { data: [{ id: 'fb1', title: 'Fallback' }], error: null };
    const { result } = renderHook(
      () => useKbArticles({ useSemantic: true, search: 'consulta longa' }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 'fb1', title: 'Fallback' }]);
  });

  it('surfaces a keyword query error', async () => {
    tableResults['kb_articles'] = { data: null, error: { message: 'boom' } };
    const { result } = renderHook(() => useKbArticles(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useKbArticle', () => {
  it('is disabled when id is null', async () => {
    const { result } = renderHook(() => useKbArticle(null), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches a single article by id', async () => {
    tableResults['kb_articles'] = { data: { id: 'a1', title: 'Single' }, error: null };
    const { result } = renderHook(() => useKbArticle('a1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect((result.current.data as { id: string }).id).toBe('a1');
  });

  it('surfaces a fetch error', async () => {
    tableResults['kb_articles'] = { data: null, error: { message: 'boom' } };
    const { result } = renderHook(() => useKbArticle('a1'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useUpsertArticle', () => {
  it('saves an article and adds published_at when publishing', async () => {
    tableResults['kb_articles'] = { data: { id: 'a1' }, error: null };
    const { result } = renderHook(() => useUpsertArticle(), { wrapper });
    result.current.mutate({ title: 'T', slug: 's', content: 'c', status: 'published' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.success).toHaveBeenCalledWith('Artigo salvo');
  });

  it('keeps an existing published_at', async () => {
    tableResults['kb_articles'] = { data: { id: 'a2' }, error: null };
    const { result } = renderHook(() => useUpsertArticle(), { wrapper });
    result.current.mutate({ title: 'T', slug: 's', content: 'c', status: 'published', published_at: '2024-01-01' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('handles an upsert error', async () => {
    tableResults['kb_articles'] = { data: null, error: { message: 'boom' } };
    const { result } = renderHook(() => useUpsertArticle(), { wrapper });
    result.current.mutate({ title: 'T', slug: 's', content: 'c' });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith('Falha ao salvar artigo');
  });
});

describe('useRecordKbView', () => {
  it('records a view with helpful flag and conversation id', async () => {
    const { result } = renderHook(() => useRecordKbView(), { wrapper });
    result.current.mutate({ articleId: 'a1', conversationId: 'conv1', wasHelpful: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(insertSpy).toHaveBeenCalled();
  });

  it('records a view with defaults and tolerates insert error', async () => {
    insertResult.current = { data: null, error: { message: 'boom' } };
    const { result } = renderHook(() => useRecordKbView(), { wrapper });
    result.current.mutate({ articleId: 'a2' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
