import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SlaViolations from '../SlaViolations';

const state = vi.hoisted(() => ({
  rows: [] as unknown[],
  total: 0,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
  stats: undefined as unknown,
  lastFilters: null as unknown,
}));

vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: () => {} }));
vi.mock('@/lib/safe-date', () => ({ safeFormatDatePtBR: () => '25/11/2026 10:00' }));
vi.mock('@/hooks/useSLA', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useSLA')>('@/hooks/useSLA');
  return {
    describeSlaBreach: actual.describeSlaBreach,
    formatDelay: actual.formatDelay,
    SLA_VIOLATIONS_PAGE_SIZE: actual.SLA_VIOLATIONS_PAGE_SIZE,
    useSlaViolationStats: () => ({ data: state.stats }),
    useSlaViolations: (filters: unknown) => {
      state.lastFilters = filters;
      return {
        data: { rows: state.rows, total: state.total },
        isLoading: state.isLoading,
        isError: state.isError,
        error: state.isError ? new Error('falha ao consultar') : null,
        refetch: state.refetch,
        isFetching: false,
      };
    },
  };
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <SlaViolations />
    </MemoryRouter>,
  );

const row = (over: Record<string, unknown> = {}) => ({
  id: 'conv-1',
  channel: 'whatsapp',
  priority: 'high',
  status: 'open',
  created_at: '2026-11-25T10:00:00Z',
  first_response_at: null,
  sla_first_response_due_at: '2020-01-01T00:00:00Z',
  sla_resolution_due_at: null,
  resolved_at: null,
  assigned_agent_name: 'Ana',
  contacts: { name: 'Cliente Teste', phone: '+5511999999999' },
  ...over,
});

describe('SlaViolations', () => {
  beforeEach(() => {
    state.rows = [];
    state.total = 0;
    state.isLoading = false;
    state.isError = false;
    state.refetch = vi.fn();
    state.lastFilters = null;
    state.stats = {
      total: 3,
      open: 1,
      avgDelayMinutes: 90,
      byChannel: { whatsapp: 2, email: 1 },
      topChannel: 'whatsapp',
    };
  });

  it('mostra os indicadores do periodo', () => {
    state.rows = [row()];
    state.total = 3;
    renderPage();
    expect(screen.getByText('Violações no período')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1 h')).toBeInTheDocument();
    expect(screen.getAllByText('whatsapp').length).toBeGreaterThan(0);
  });

  it('lista contato, motivo e atraso de cada violacao', () => {
    state.rows = [
      row(),
      row({
        id: 'conv-2',
        channel: 'email',
        priority: 'normal',
        status: 'resolved',
        contacts: null,
        first_response_at: '2020-01-01T00:05:00Z',
        sla_first_response_due_at: null,
        sla_resolution_due_at: '2020-01-01T00:10:00Z',
        resolved_at: '2020-01-01T00:55:00Z',
      }),
    ];
    state.total = 2;
    renderPage();
    expect(screen.getByText('Cliente Teste')).toBeInTheDocument();
    expect(screen.getByText('Sem contato')).toBeInTheDocument();
    expect(screen.getByText('Sem primeira resposta a tempo')).toBeInTheDocument();
    expect(screen.getByText('Resolução fora do prazo')).toBeInTheDocument();
    expect(screen.getByText('45 min')).toBeInTheDocument();
  });

  it('mostra vazio quando nao ha violacao', () => {
    renderPage();
    expect(screen.getByText('Nenhuma violação no período')).toBeInTheDocument();
  });

  it('mostra erro com a mensagem real', () => {
    state.isError = true;
    renderPage();
    expect(screen.getByText('Não foi possível carregar as violações')).toBeInTheDocument();
    expect(screen.getByText('falha ao consultar')).toBeInTheDocument();
  });

  it('o botao atualizar refaz a consulta', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Atualizar/ }));
    expect(state.refetch).toHaveBeenCalledTimes(1);
  });

  it('o filtro de abertas volta para a primeira pagina e pede so abertas', () => {
    state.rows = Array.from({ length: 20 }, (_, i) => row({ id: `conv-${i}` }));
    state.total = 45;
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));
    expect((state.lastFilters as { page: number }).page).toBe(1);

    fireEvent.click(screen.getByRole('switch'));
    expect(state.lastFilters).toMatchObject({ onlyOpen: true, page: 0 });
  });
});