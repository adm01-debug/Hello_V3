// Etapa 230 (A-097): a tela de erros do cliente lista, filtra e resolve.
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mutateMock = vi.fn();
const refetchMock = vi.fn();
const state: {
  list: { data: unknown; isLoading: boolean; isFetching: boolean; isError: boolean; error: Error | null };
  stats: { data: { last24h: number; open: number } | undefined };
} = {
  list: { data: undefined, isLoading: true, isFetching: false, isError: false, error: null },
  stats: { data: { last24h: 3, open: 2 } },
};

vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));

vi.mock('@/hooks/useClientErrors', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useClientErrors')>(
    '@/hooks/useClientErrors',
  );
  return {
    ...actual,
    useClientErrors: (args: unknown) => ({ ...state.list, refetch: refetchMock, args }),
    useClientErrorStats: () => state.stats,
    useResolveClientError: () => ({ mutate: mutateMock, isPending: false }),
  };
});

import ClientErrorsPage from '@/pages/admin/ClientErrors';

const row = {
  id: 'err-1',
  occurred_at: '2026-11-26T12:00:00.000Z',
  user_id: 'user-1',
  route: '/calls',
  error_type: 'unhandled-rejection',
  message: 'TypeError: x is not a function',
  stack: 'at y',
  correlation_id: 'trace-abc',
  resolved_at: null,
  resolved_by: null,
};

describe('pagina Erros do Cliente', () => {
  beforeEach(() => {
    mutateMock.mockClear();
    refetchMock.mockClear();
    state.list = { data: undefined, isLoading: true, isFetching: false, isError: false, error: null };
    state.stats = { data: { last24h: 3, open: 2 } };
  });

  it('mostra os KPIs e a tabela com rota, mensagem e trace', () => {
    state.list = {
      data: { rows: [row], total: 1, page: 0, pageSize: 25 },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
    };
    render(React.createElement(ClientErrorsPage));

    expect(screen.getByRole('heading', { name: 'Erros do Cliente' })).toBeTruthy();
    expect(screen.getByText('/calls')).toBeTruthy();
    expect(screen.getByText('TypeError: x is not a function')).toBeTruthy();
    expect(screen.getByText('trace-abc')).toBeTruthy();
    expect(screen.getByText('Promise rejeitada')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('resolve o erro escolhido', () => {
    state.list = {
      data: { rows: [row], total: 1, page: 0, pageSize: 25 },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
    };
    render(React.createElement(ClientErrorsPage));
    fireEvent.click(screen.getByRole('button', { name: /resolver/i }));
    expect(mutateMock).toHaveBeenCalledWith('err-1');
  });

  it('estado vazio explica o filtro de nao resolvidos', () => {
    state.list = {
      data: { rows: [], total: 0, page: 0, pageSize: 25 },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
    };
    render(React.createElement(ClientErrorsPage));
    expect(screen.getByText(/Nenhum erro em aberto/i)).toBeTruthy();
  });

  it('estado de erro mostra a mensagem e nao quebra a tela', () => {
    state.list = {
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      error: new Error('permission denied'),
    };
    render(React.createElement(ClientErrorsPage));
    expect(screen.getByText(/permission denied/)).toBeTruthy();
  });

  it('filtro por rota e recarregar chamam o hook', () => {
    state.list = {
      data: { rows: [], total: 0, page: 0, pageSize: 25 },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
    };
    render(React.createElement(ClientErrorsPage));
    fireEvent.change(screen.getByLabelText('Filtrar por rota'), { target: { value: '/calls' } });
    expect((screen.getByLabelText('Filtrar por rota') as HTMLInputElement).value).toBe('/calls');
    fireEvent.click(screen.getByRole('button', { name: /atualizar/i }));
    expect(refetchMock).toHaveBeenCalled();
  });
});