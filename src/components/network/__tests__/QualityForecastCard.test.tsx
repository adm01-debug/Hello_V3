import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QualityForecastCard } from '../QualityForecastCard';

const { insertMock, getUserMock } = vi.hoisted(() => ({
  insertMock: vi.fn(),
  getUserMock: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: getUserMock, getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    from: () => ({ insert: insertMock }),
  },
}));

const capacity = {
  confidence: 82,
  generated_at: '2026-11-24T00:00:00Z',
  recommendations: [
    {
      id: 'cap-1',
      action_type: 'add_agents' as const,
      title: 'Reforcar 4 agentes às 14h',
      description: 'Volume previsto 30% acima do P95.',
      window_start: '2026-11-24T14:00:00Z',
      window_end: '2026-11-24T16:00:00Z',
      severity: 'warning' as const,
      confidence: 0.82,
      evidence: { volume_predicted: 420, risk_reason: 'pico' },
    },
  ],
};

vi.mock('@/hooks/useVoipQualityForecast', () => ({
  useVoipQualityForecastFetch: () => ({
    data: {
      forecast: [],
      summary: { avg_mos_predicted: 4.1, risk_windows: 1, p95_volume_historical: 320, trend_slope_mos: 0.01 },
      insufficient_data: false,
    },
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useVoipCapacityRecommendations', () => ({
  useVoipCapacityRecommendations: () => ({ data: capacity }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  ReferenceLine: () => null,
  Tooltip: () => null,
}));
vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));

import { toast } from 'sonner';

function renderCard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><QualityForecastCard /></QueryClientProvider>);
}

describe('QualityForecastCard — recomendacao de capacity registra leitura (E178)', () => {
  beforeEach(() => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    insertMock.mockResolvedValue({ error: null });
  });

  it('nao promete execucao: o botao diz "Marcar como lida"', () => {
    renderCard();
    expect(screen.getByRole('button', { name: 'Marcar como lida' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aplicar' })).toBeNull();
  });

  it('grava a acao com outcome dismissed e os dados da recomendacao', async () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como lida' }));

    await waitFor(() => expect(insertMock).toHaveBeenCalledTimes(1));
    const [rows] = insertMock.mock.calls[0] as [Record<string, unknown>[]];
    expect(rows[0]).toMatchObject({
      user_id: 'user-1',
      recommendation_id: 'cap-1',
      category: 'capacity',
      severity: 'warning',
      action_type: 'add_agents',
      outcome: 'dismissed',
    });
    expect(rows[0].notes).toMatch(/decisao humana/);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Lida' })).toBeDisabled());
    expect(toast.success).toHaveBeenCalled();
  });

  it('nao afirma sucesso quando o insert falha', async () => {
    insertMock.mockResolvedValue({ error: { message: 'rls' } });
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como lida' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Marcar como lida' })).toBeEnabled();
  });
});
