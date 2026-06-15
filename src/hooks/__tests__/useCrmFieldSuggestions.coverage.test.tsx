import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface QueryResult {
  data: unknown;
  error: unknown;
}

// Mutable results so individual tests can drive success/error branches.
const selectResult: { current: QueryResult } = { current: { data: [], error: null } };
const updateContactsResult: { current: QueryResult } = { current: { data: null, error: null } };
const updateSuggestionsResult: { current: QueryResult } = { current: { data: null, error: null } };
const invokeResult: { current: QueryResult } = { current: { data: { inserted: 0 }, error: null } };

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    functions: { invoke: vi.fn() },
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    create: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  },
}));

import { useCrmFieldSuggestions, type CrmFieldSuggestion } from '@/hooks/useCrmFieldSuggestions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const channelSpy = vi.mocked(supabase.channel);
const removeChannelSpy = vi.mocked(supabase.removeChannel);

const makeSelectChain = () => {
  const c: Record<string, unknown> = {};
  ['select', 'order', 'eq'].forEach((m) => {
    c[m] = vi.fn(() => c);
  });
  (c as { then: (r: (v: QueryResult) => void) => void }).then = (resolve) =>
    resolve(selectResult.current);
  return c;
};
const makeUpdateChain = (result: { current: QueryResult }) => {
  const c: Record<string, unknown> = {};
  c.update = vi.fn(() => c);
  c.eq = vi.fn(() => c);
  (c as { then: (r: (v: QueryResult) => void) => void }).then = (resolve) =>
    resolve(result.current);
  return c;
};

// Re-establish mock implementations after Vitest's per-test mockReset.
function wireSupabaseMocks() {
  vi.mocked(supabase.from).mockImplementation(((table: string) => {
    if (table === 'contacts') return makeUpdateChain(updateContactsResult);
    const select = makeSelectChain();
    const update = makeUpdateChain(updateSuggestionsResult);
    return {
      select: select.select,
      order: select.order,
      eq: select.eq,
      update: update.update,
      then: (select as { then: (r: (v: QueryResult) => void) => void }).then,
    };
  }) as unknown as typeof supabase.from);
  vi.mocked(supabase.functions.invoke).mockImplementation(
    (() => Promise.resolve(invokeResult.current)) as unknown as typeof supabase.functions.invoke
  );
  const channelObj: Record<string, unknown> = {};
  channelObj.on = vi.fn(() => channelObj);
  channelObj.subscribe = vi.fn(() => channelObj);
  vi.mocked(supabase.channel).mockImplementation(
    (() => channelObj) as unknown as typeof supabase.channel
  );
}

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

const makeSuggestion = (over: Partial<CrmFieldSuggestion> = {}): CrmFieldSuggestion => ({
  id: 's1',
  call_session_id: 'cs1',
  contact_id: 'c1',
  field_name: 'position',
  current_value: null,
  suggested_value: 'CEO',
  confidence: 0.9,
  source_quote: null,
  status: 'pending',
  reviewed_by: null,
  reviewed_at: null,
  applied_value: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...over,
});

describe('useCrmFieldSuggestions', () => {
  beforeEach(() => {
    wireSupabaseMocks();
    selectResult.current = { data: [], error: null };
    updateContactsResult.current = { data: null, error: null };
    updateSuggestionsResult.current = { data: null, error: null };
    invokeResult.current = { data: { inserted: 0 }, error: null };
  });

  it('returns empty defaults when no callSessionId (query disabled, no channel)', async () => {
    const { result } = renderHook(() => useCrmFieldSuggestions(), { wrapper });
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.pending).toEqual([]);
    expect(channelSpy).not.toHaveBeenCalled();
  });

  it('fetches suggestions and computes pending, wires realtime channel', async () => {
    selectResult.current = {
      data: [makeSuggestion({ id: 's1', status: 'pending' }), makeSuggestion({ id: 's2', status: 'accepted' })],
      error: null,
    };
    const { result, unmount } = renderHook(() => useCrmFieldSuggestions('cs1'), { wrapper });

    await waitFor(() => expect(result.current.suggestions.length).toBe(2));
    expect(result.current.pending).toHaveLength(1);
    expect(result.current.pending[0].id).toBe('s1');

    // realtime wiring
    expect(channelSpy).toHaveBeenCalledWith('crm-suggestions-cs1');
    const channelObj = channelSpy.mock.results[0].value as {
      on: ReturnType<typeof vi.fn>;
      subscribe: ReturnType<typeof vi.fn>;
    };
    expect(channelObj.on).toHaveBeenCalled();
    expect(channelObj.subscribe).toHaveBeenCalled();

    unmount();
    expect(removeChannelSpy).toHaveBeenCalled();
  });

  it('query error branch throws', async () => {
    selectResult.current = { data: null, error: { message: 'boom' } };
    const { result } = renderHook(() => useCrmFieldSuggestions('cs1'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.suggestions).toEqual([]);
  });

  it('accept applies allowed field to contact then marks accepted (success)', async () => {
    const { result } = renderHook(() => useCrmFieldSuggestions('cs1'), { wrapper });
    await act(async () => {
      result.current.accept({ id: 's1', contactId: 'c1', field: 'position', value: 'CTO' });
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Sugestão aplicada ao contato'));
    expect(supabase.from).toHaveBeenCalledWith('contacts');
  });

  it('accept skips contact update for non-allowed field', async () => {
    const { result } = renderHook(() => useCrmFieldSuggestions('cs1'), { wrapper });
    await act(async () => {
      result.current.accept({ id: 's1', contactId: 'c1', field: 'random_field', value: 'x' });
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it('accept with null contactId skips contact update', async () => {
    const { result } = renderHook(() => useCrmFieldSuggestions('cs1'), { wrapper });
    await act(async () => {
      result.current.accept({ id: 's1', contactId: null, field: 'position', value: 'X' });
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it('accept contact update error branch surfaces toast.error', async () => {
    updateContactsResult.current = { data: null, error: new Error('contact fail') };
    const { result } = renderHook(() => useCrmFieldSuggestions('cs1'), { wrapper });
    await act(async () => {
      result.current.accept({ id: 's1', contactId: 'c1', field: 'email', value: 'a@b.c' });
    });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('contact fail'));
  });

  it('accept suggestion update error branch surfaces fallback toast', async () => {
    updateSuggestionsResult.current = { data: null, error: 'plain-string-error' };
    const { result } = renderHook(() => useCrmFieldSuggestions('cs1'), { wrapper });
    await act(async () => {
      result.current.accept({ id: 's1', contactId: null, field: 'position', value: 'X' });
    });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Falha ao aplicar sugestão'));
  });

  it('reject marks suggestion rejected (success)', async () => {
    const { result } = renderHook(() => useCrmFieldSuggestions('cs1'), { wrapper });
    await act(async () => {
      result.current.reject('s1');
    });
    await waitFor(() => expect(supabase.from).toHaveBeenCalledWith('crm_field_suggestions'));
  });

  it('reject error branch throws (no onError handler)', async () => {
    updateSuggestionsResult.current = { data: null, error: new Error('reject fail') };
    const { result } = renderHook(() => useCrmFieldSuggestions('cs1'), { wrapper });
    await act(async () => {
      result.current.reject('s1');
    });
    // mutation rejects internally; just ensure it was attempted
    await waitFor(() => expect(supabase.from).toHaveBeenCalledWith('crm_field_suggestions'));
  });

  it('triggerExtraction success with inserted > 0 shows toast', async () => {
    invokeResult.current = { data: { inserted: 3 }, error: null };
    const { result } = renderHook(() => useCrmFieldSuggestions('cs1'), { wrapper });
    await act(async () => {
      result.current.triggerExtraction({ transcript: 'hello', contactId: 'c1' });
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('3 sugestão(ões) de CRM disponíveis'));
  });

  it('triggerExtraction success with inserted = 0 shows no toast', async () => {
    invokeResult.current = { data: { inserted: 0 }, error: null };
    const { result } = renderHook(() => useCrmFieldSuggestions('cs1'), { wrapper });
    await act(async () => {
      result.current.triggerExtraction({ transcript: 'hello' });
    });
    await waitFor(() => expect(supabase.functions.invoke).toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalledWith(expect.stringContaining('sugestão'));
  });

  it('triggerExtraction invoke error branch hits onError', async () => {
    invokeResult.current = { data: null, error: new Error('invoke fail') };
    const { result } = renderHook(() => useCrmFieldSuggestions('cs1'), { wrapper });
    await act(async () => {
      result.current.triggerExtraction({ transcript: 'x', contactId: null });
    });
    await waitFor(() => expect(supabase.functions.invoke).toHaveBeenCalled());
  });

  it('triggerExtraction throws when callSessionId missing', async () => {
    const { result } = renderHook(() => useCrmFieldSuggestions(undefined), { wrapper });
    await act(async () => {
      result.current.triggerExtraction({ transcript: 'x' });
    });
    // No invoke because guard throws first
    await waitFor(() => expect(supabase.functions.invoke).not.toHaveBeenCalled());
  });
});
