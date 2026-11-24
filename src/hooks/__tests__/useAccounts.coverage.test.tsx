import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAccounts } from '../useAccounts';

const state = {
  loadError: null as unknown,
  insertError: null as unknown,
  updateError: null as unknown,
  invokeError: null as unknown,
  invokeData: { signals_persisted: 2 } as unknown,
  rows: null as unknown[] | null,
};

const account = {
  id: 'a1', name: 'Acme', segment: 'enterprise', mrr: 1000, arr: 12000,
  csm_agent_name: 'Maria', health_score: 75, health_factors: {},
  churn_risk_score: 20, current_stage: 'adoption', status: 'active',
  metadata: {}, created_at: '', updated_at: '',
  domain: null, contract_start_date: null, contract_end_date: null,
  last_contact_at: null, next_review_at: null, notes: null, tags: null,
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => {
      const builder: Record<string, unknown> = {};
      builder.select = vi.fn(() => builder);
      builder.insert = vi.fn(() => builder);
      builder.update = vi.fn(() => builder);
      builder.eq = vi.fn(() => Promise.resolve({ data: null, error: state.updateError }));
      // A lista passou a ser paginada com .range(): o mock precisa cortar por
      // `from` e devolver `count` como o PostgREST faz.
      const allRows = () => state.rows ?? [account];
      builder.order = vi.fn(() => builder);
      builder.range = vi.fn((from: number) => Promise.resolve({
        data: allRows().slice(from, from + 50), error: state.loadError, count: allRows().length,
      }));
      builder.then = (res: (v: unknown) => unknown) =>
        Promise.resolve({ data: allRows(), error: state.loadError, count: allRows().length }).then(res);
      builder.single = vi.fn(() => Promise.resolve({ data: account, error: state.insertError }));
      return builder;
    }),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: state.invokeData, error: state.invokeError })),
    },
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/logger', () => {
  const mk = () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() });
  return { logger: { create: vi.fn(mk), ...mk() } };
});

beforeEach(() => {
  state.loadError = null;
  state.insertError = null;
  state.updateError = null;
  state.invokeError = null;
  state.invokeData = { signals_persisted: 2 };
  state.rows = null;
  vi.clearAllMocks();
});

describe('useAccounts coverage', () => {
  it('handles load error', async () => {
    state.loadError = new Error('load fail');
    const { result } = renderHook(() => useAccounts());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const { toast } = await import('sonner');
    expect(toast.error).toHaveBeenCalledWith('Falha ao carregar contas');
  });

  it('create success', async () => {
    const { result } = renderHook(() => useAccounts());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let created: unknown;
    await act(async () => { created = await result.current.create({ name: 'New' }); });
    expect((created as { id: string }).id).toBe('a1');
    const { toast } = await import('sonner');
    expect(toast.success).toHaveBeenCalledWith('Conta criada');
  });

  it('create error returns null', async () => {
    const { result } = renderHook(() => useAccounts());
    await waitFor(() => expect(result.current.loading).toBe(false));
    state.insertError = new Error('insert fail');
    let created: unknown = 'x';
    await act(async () => { created = await result.current.create({ name: 'X' }); });
    expect(created).toBeNull();
    const { toast } = await import('sonner');
    expect(toast.error).toHaveBeenCalledWith('Falha ao criar conta');
  });

  it('update success and error', async () => {
    const { result } = renderHook(() => useAccounts());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.update('a1', { mrr: 2000 }); });
    const { toast } = await import('sonner');
    expect(toast.success).toHaveBeenCalledWith('Conta atualizada');

    state.updateError = new Error('update fail');
    await act(async () => { await result.current.update('a1', { mrr: 3000 }); });
    expect(toast.error).toHaveBeenCalledWith('Falha ao atualizar conta');
  });

  it('recomputeHealth success and error', async () => {
    const { result } = renderHook(() => useAccounts());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.recomputeHealth('a1'); });
    const { toast } = await import('sonner');
    expect(toast.success).toHaveBeenCalledWith('Health score recalculado');

    state.invokeError = new Error('invoke fail');
    await act(async () => { await result.current.recomputeHealth('a1'); });
    expect(toast.error).toHaveBeenCalledWith('Falha ao recalcular health');
  });

  it('detectChurn success and error', async () => {
    const { result } = renderHook(() => useAccounts());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.detectChurn('a1'); });
    const { toast } = await import('sonner');
    expect(toast.success).toHaveBeenCalledWith('Detecção concluída: 2 novo(s) sinal(is)');

    state.invokeData = {};
    await act(async () => { await result.current.detectChurn('a1'); });
    expect(toast.success).toHaveBeenCalledWith('Detecção concluída: 0 novo(s) sinal(is)');

    state.invokeError = new Error('invoke fail');
    await act(async () => { await result.current.detectChurn('a1'); });
    expect(toast.error).toHaveBeenCalledWith('Falha ao detectar risco de churn');
  });

  it('refresh re-loads', async () => {
    const { result } = renderHook(() => useAccounts());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.refresh(); });
    expect(result.current.accounts.length).toBe(1);
  });

  it('pagina de 50 em 50 sem repetir e informa o total', async () => {
    state.rows = Array.from({ length: 55 }, (_, i) => ({ ...account, id: `a${i}`, name: `Conta ${i}` }));
    const { result } = renderHook(() => useAccounts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.accounts).toHaveLength(50);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.totalCount).toBe(55);

    await act(async () => { await result.current.loadMore(); });

    expect(result.current.accounts).toHaveLength(55);
    expect(new Set(result.current.accounts.map((a) => a.id)).size).toBe(55);
    expect(result.current.hasMore).toBe(false);
  });
});
