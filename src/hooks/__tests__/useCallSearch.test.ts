import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCallSearch } from '@/hooks/useCallSearch';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: vi.fn() },
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('useCallSearch', () => {
  beforeEach(() => vi.clearAllMocks());

  it('inicia vazio', () => {
    const { result } = renderHook(() => useCallSearch());
    expect(result.current.results).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('não chama backend quando query vazia', async () => {
    const { result } = renderHook(() => useCallSearch());
    await act(async () => { await result.current.search('   '); });
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
    expect(result.current.results).toEqual([]);
  });

  it('preenche resultados em sucesso', async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: { results: [{ id: '1', call_session_id: 'c1', agent_name: 'A', duration_seconds: 60, created_at: '2024-01-01', snippet: 'olá' }], count: 1 },
      error: null,
    });
    const { result } = renderHook(() => useCallSearch());
    await act(async () => { await result.current.search('olá'); });
    await waitFor(() => expect(result.current.results.length).toBe(1));
    expect(result.current.total).toBe(1);
  });

  it('encaminha filtros e paginação', async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({ data: { results: [], count: 0 }, error: null });
    const { result } = renderHook(() => useCallSearch());
    await act(async () => {
      await result.current.search('preco', { agentName: 'João', momentType: 'price' }, { limit: 10, offset: 20 });
    });
    expect(supabase.functions.invoke).toHaveBeenCalledWith('search-calls', expect.objectContaining({
      body: expect.objectContaining({ query: 'preco', agentName: 'João', momentType: 'price', limit: 10, offset: 20 }),
    }));
  });

  it('captura erro em falha', async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({ data: null, error: new Error('boom') });
    const { result } = renderHook(() => useCallSearch());
    await act(async () => { await result.current.search('x'); });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.results).toEqual([]);
  });
});
