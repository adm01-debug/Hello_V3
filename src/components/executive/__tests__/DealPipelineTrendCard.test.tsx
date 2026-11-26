import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { DealPipelineTrendCard } from '@/components/executive/DealPipelineTrendCard';

const state = vi.hoisted(() => ({
  days: 30,
  calls: [] as number[],
  refetch: vi.fn(),
  result: {} as Record<string, unknown>,
}));

vi.mock('@/hooks/useDealPipelineTrend', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useDealPipelineTrend')>();
  return {
    ...actual,
    useDealPipelineTrend: (days: number) => {
      state.days = days;
      state.calls.push(days);
      return state.result;
    },
  };
});

const twoDays = [
  { snapshot_date: '2026-11-20', open_count: 10, total_value_cents: 1_000_000, weighted_value_cents: 400_000 },
  { snapshot_date: '2026-11-26', open_count: 12, total_value_cents: 1_200_000, weighted_value_cents: 500_000 },
];

beforeEach(() => {
  state.calls = [];
  state.refetch = vi.fn();
  state.result = { data: twoDays, isLoading: false, isError: false, refetch: state.refetch };
});

describe('DealPipelineTrendCard', () => {
  it('mostra carregamento enquanto a serie nao chega', () => {
    state.result = { data: undefined, isLoading: true, isError: false, refetch: state.refetch };
    render(<DealPipelineTrendCard />);
    expect(screen.getByText('Carregando histórico...')).toBeInTheDocument();
  });

  it('explica quando ainda nao existe retrato no periodo', () => {
    state.result = { data: [], isLoading: false, isError: false, refetch: state.refetch };
    render(<DealPipelineTrendCard />);
    expect(screen.getByText(/Ainda não há retrato diário do pipeline neste período/)).toBeInTheDocument();
  });

  it('mostra erro com opcao de tentar de novo', () => {
    state.result = { data: undefined, isLoading: false, isError: true, refetch: state.refetch };
    render(<DealPipelineTrendCard />);
    expect(screen.getByText('Não foi possível carregar o histórico do pipeline.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(state.refetch).toHaveBeenCalled();
  });

  it('mostra o valor de hoje, a variacao e as oportunidades abertas', () => {
    render(<DealPipelineTrendCard />);
    expect(screen.getByText(/12\.000,00/)).toBeInTheDocument();
    expect(screen.getByText('+20%')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText(/Previsão ponderada de hoje:/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Evolução do valor do pipeline aberto por dia' })).toBeInTheDocument();
  });

  it('avisa quando o periodo tem apenas o primeiro retrato', () => {
    state.result = { data: [twoDays[0]], isLoading: false, isError: false, refetch: state.refetch };
    render(<DealPipelineTrendCard />);
    expect(screen.getByText('Primeiro retrato do período')).toBeInTheDocument();
  });

  it('troca o periodo e recarrega a serie', () => {
    render(<DealPipelineTrendCard />);
    expect(state.calls).toEqual([30]);
    fireEvent.mouseDown(screen.getByRole('tab', { name: '7d' }));
    expect(state.calls).toContain(7);
  });

  it('deixa claro que a serie e restrita e permite atualizar na mao', () => {
    render(<DealPipelineTrendCard />);
    expect(screen.getByText(/visível só para administradores e supervisores/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar' }));
    expect(state.refetch).toHaveBeenCalled();
  });
});