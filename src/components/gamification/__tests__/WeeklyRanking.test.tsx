import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const { orderMock } = vi.hoisted(() => ({ orderMock: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({ select: () => ({ gte: () => ({ order: orderMock }) }) }),
  },
}));

import { WeeklyRanking } from '../WeeklyRanking';

describe('WeeklyRanking', () => {
  beforeEach(() => {
    orderMock.mockReset();
  });

  it('avisa que a leitura falhou em vez de dizer que nao ha dados', async () => {
    // A-009 / etapa 201: ranking vazio por erro de consulta nao pode ser lido
    // como "nenhum agente produziu nada".
    orderMock.mockResolvedValue({ data: null, error: { message: 'timeout' } });

    render(<WeeklyRanking />);

    expect(await screen.findByText(/Não foi possível carregar o ranking/)).toBeInTheDocument();
    expect(screen.getByText(/timeout/)).toBeInTheDocument();
    expect(screen.queryByText('Nenhum dado disponível para esta semana.')).toBeNull();
  });

  it('mostra o estado vazio quando a leitura funciona', async () => {
    orderMock.mockResolvedValue({ data: [], error: null });

    render(<WeeklyRanking />);

    expect(await screen.findByText('Nenhum dado disponível para esta semana.')).toBeInTheDocument();
    expect(screen.queryByText(/Não foi possível carregar o ranking/)).toBeNull();
  });
});
