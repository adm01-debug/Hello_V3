import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

type Result = { data: unknown; error: unknown };

const state: {
  selectResult: Result;
  upsertResult: Result;
  deleteResult: Result;
  updateResult: Result;
  user: { id: string } | null;
} = {
  selectResult: { data: [], error: null },
  upsertResult: { data: null, error: null },
  deleteResult: { data: null, error: null },
  updateResult: { data: null, error: null },
  user: { id: 'user-1' },
};

const selectChain = () => {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  (chain as { then: (resolve: (v: Result) => void) => void }).then = (resolve) =>
    resolve(state.selectResult);
  return chain;
};

const deleteEq = vi.fn(() => Promise.resolve(state.deleteResult));
const updateEq = vi.fn(() => Promise.resolve(state.updateResult));

const fromMock = vi.fn(() => ({
  select: vi.fn(() => selectChain()),
  upsert: vi.fn(() => Promise.resolve(state.upsertResult)),
  delete: vi.fn(() => ({ eq: deleteEq })),
  update: vi.fn(() => ({ eq: updateEq })),
}));

// Depois de cada gravação o hook recarrega a lista, então a última chamada de
// `from()` costuma ser a leitura: procure sempre a que realmente escreveu.
const lastCallOf = (method: 'upsert' | 'delete' | 'update') =>
  fromMock.mock.results
    .map((r) => r.value[method as 'upsert'])
    .filter((fn) => fn.mock.calls.length > 0)
    .at(-1)!;
const getUserMock = vi.fn(() => Promise.resolve({ data: { user: state.user } }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => fromMock(),
    auth: { getUser: () => getUserMock() },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { useSavedFilters } from '../useSavedFilters';

const preset = {
  id: 'f1',
  user_id: 'user-1',
  entity_type: 'contacts',
  name: 'Bitrix com telefone',
  filters: { search: 'ana', filters: { hasPhone: true } },
  is_default: false,
  created_at: '2026-11-27T10:00:00.000Z',
  updated_at: '2026-11-27T10:00:00.000Z',
};

describe('useSavedFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteEq.mockClear();
    updateEq.mockClear();
    state.selectResult = { data: [], error: null };
    state.upsertResult = { data: null, error: null };
    state.deleteResult = { data: null, error: null };
    state.updateResult = { data: null, error: null };
    state.user = { id: 'user-1' };
  });

  it('carrega os filtros salvos da entidade', async () => {
    state.selectResult = { data: [preset], error: null };
    const { result } = renderHook(() => useSavedFilters('contacts'));

    await waitFor(() => expect(result.current.savedFilters).toHaveLength(1));
    expect(result.current.savedFilters[0].name).toBe('Bitrix com telefone');
    expect(result.current.error).toBeNull();

    const chain = fromMock.mock.results[0].value.select.mock.results[0].value;
    expect(chain.eq).toHaveBeenCalledWith('entity_type', 'contacts');
    expect(chain.order).toHaveBeenCalledWith('is_default', { ascending: false });
    expect(chain.order).toHaveBeenCalledWith('name', { ascending: true });
  });

  it('expõe mensagem e lista vazia quando a leitura falha', async () => {
    state.selectResult = { data: null, error: { message: 'permission denied' } };
    const { result } = renderHook(() => useSavedFilters('contacts'));

    await waitFor(() => expect(result.current.error).toBe('Não foi possível carregar seus filtros salvos.'));
    expect(result.current.savedFilters).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('salva o filtro com o usuário autenticado', async () => {
    const { result } = renderHook(() => useSavedFilters('contacts'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let outcome: { ok: boolean } = { ok: false };
    await act(async () => {
      outcome = await result.current.saveFilter({
        name: '  Bitrix com telefone  ',
        filters: { search: 'ana' },
        isDefault: true,
      });
    });

    expect(outcome.ok).toBe(true);
    expect(getUserMock).toHaveBeenCalled();
    const upsert = lastCallOf('upsert');
    expect(upsert).toHaveBeenCalledWith(
      {
        user_id: 'user-1',
        entity_type: 'contacts',
        name: 'Bitrix com telefone',
        filters: { search: 'ana' },
        is_default: true,
      },
      { onConflict: 'user_id,entity_type,name' },
    );
  });

  it('não tenta gravar quando não há usuário autenticado', async () => {
    state.user = null;
    const { result } = renderHook(() => useSavedFilters('contacts'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let outcome: { ok: boolean } = { ok: true };
    await act(async () => {
      outcome = await result.current.saveFilter({ name: 'Sem sessão', filters: {} });
    });

    expect(outcome.ok).toBe(false);
    expect(result.current.error).toBe('Entre na sua conta para salvar filtros.');
    expect(fromMock.mock.results.every((r) => r.value.upsert.mock.calls.length === 0)).toBe(true);
  });

  it('recusa nome vazio sem chamar o banco', async () => {
    const { result } = renderHook(() => useSavedFilters('contacts'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const callsBefore = getUserMock.mock.calls.length;

    let outcome: { ok: boolean } = { ok: true };
    await act(async () => {
      outcome = await result.current.saveFilter({ name: '   ', filters: {} });
    });

    expect(outcome.ok).toBe(false);
    expect(result.current.error).toBe('Dê um nome ao filtro.');
    expect(getUserMock.mock.calls.length).toBe(callsBefore);
  });

  it('remove um filtro pelo id', async () => {
    const { result } = renderHook(() => useSavedFilters('contacts'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let outcome: { ok: boolean } = { ok: false };
    await act(async () => {
      outcome = await result.current.deleteFilter('f1');
    });

    expect(outcome.ok).toBe(true);
    expect(lastCallOf('delete')).toHaveBeenCalledTimes(1);
    expect(deleteEq).toHaveBeenCalledWith('id', 'f1');
  });

  it('marca um filtro como padrão', async () => {
    const { result } = renderHook(() => useSavedFilters('contacts'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let outcome: { ok: boolean } = { ok: false };
    await act(async () => {
      outcome = await result.current.setDefaultFilter('f1');
    });

    expect(outcome.ok).toBe(true);
    expect(lastCallOf('update')).toHaveBeenCalledWith({ is_default: true });
    expect(updateEq).toHaveBeenCalledWith('id', 'f1');
  });
});
