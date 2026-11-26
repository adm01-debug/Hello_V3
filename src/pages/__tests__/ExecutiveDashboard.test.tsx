import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const { hookMock } = vi.hoisted(() => ({ hookMock: vi.fn() }));

vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));
vi.mock('@/hooks/useExecutiveDashboard', () => ({ useExecutiveDashboardData: hookMock }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: vi.fn() } }));
vi.mock('@/hooks/useDealPipelineTrend', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useDealPipelineTrend')>();
  return {
    ...actual,
    useDealPipelineTrend: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
  };
});

import ExecutiveDashboard from '../ExecutiveDashboard';

const base = {
  metrics: {},
  callsByDay: [],
  satisfactionTrend: [],
  sentimentData: [],
  topAgents: [],
  goalsComparison: [],
  holdByAgent: [],
  isLoading: false,
  error: null as string | null,
  lastUpdate: new Date(),
  refetch: vi.fn(),
};

describe('ExecutiveDashboard', () => {
  beforeEach(() => {
    hookMock.mockReset();
  });

  it('alarma quando a leitura das metricas falha, sem zerar os numeros', () => {
    hookMock.mockReturnValue({ ...base, error: 'timeout' });

    render(<ExecutiveDashboard />);

    expect(screen.getByText('Não foi possível carregar o dashboard')).toBeInTheDocument();
    expect(screen.getByText('timeout')).toBeInTheDocument();
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Executivo')).toBeNull();
  });
});