import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const { useQueueMetricsMock } = vi.hoisted(() => ({ useQueueMetricsMock: vi.fn() }));

vi.mock('@/hooks/useQueueMetrics', () => ({ useQueueMetrics: useQueueMetricsMock }));
vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));
vi.mock('@/components/dashboard/DashboardGoalsSettings', () => ({ DashboardGoalsSettings: () => <div data-testid="goals-settings" /> }));
vi.mock('@/components/dashboard/GoalViolationsHistory', () => ({ GoalViolationsHistory: () => <div data-testid="violations" /> }));
vi.mock('@/components/queue/QueueMetricsCards', () => ({ QueueMetricsCards: () => <div data-testid="metric-cards" /> }));
vi.mock('@/components/queue/QueueGoalsTab', () => ({ QueueGoalsTab: () => <div data-testid="goals-tab" /> }));
vi.mock('@/components/queue/QueueRealtimeCharts', () => ({ QueueRealtimeCharts: () => <div data-testid="charts" /> }));

import QueueMetricsDashboard from '../QueueMetricsDashboard';

const baseState = {
  metrics: { activeCalls: 0, waitingCalls: 0, avgWaitTime: 0, avgHandleTime: 0, abandonmentRate: 0, serviceLevel: 0, agentsAvailable: 0, agentsBusy: 0, agentsOnBreak: 0 },
  realtimeData: [],
  loading: false,
  lastUpdate: new Date(2026, 10, 24, 3, 0, 0),
  goals: [],
  goalStatuses: [],
  activeTab: 'dashboard',
  setActiveTab: vi.fn(),
  checkingGoals: false,
  fetchMetrics: vi.fn(),
  fetchGoals: vi.fn(),
  runGoalsCheck: vi.fn(),
  formatTime: (s: number) => `${s}s`,
  formatGoalValue: (v: number) => `${v}%`,
  criticalGoals: [],
  warningGoals: [],
  error: null as string | null,
  hasLoaded: true,
};

describe('QueueMetricsDashboard', () => {
  it('avisa que nada foi lido e nao desenha numeros quando a leitura falhou', () => {
    // A-009: o painel mostrava zeros tanto em dia calmo quanto com a consulta
    // quebrada; agora falta de leitura vira erro visivel e nenhum numero.
    useQueueMetricsMock.mockReturnValue({ ...baseState, error: 'permission denied for table call_sessions', hasLoaded: false });

    render(<QueueMetricsDashboard />);

    expect(screen.getByText('Não foi possível carregar as métricas')).toBeInTheDocument();
    expect(screen.getByText('permission denied for table call_sessions')).toBeInTheDocument();
    expect(screen.getByText(/Nenhuma leitura bem-sucedida/)).toBeInTheDocument();
    expect(screen.queryByTestId('metric-cards')).toBeNull();
    expect(screen.queryByTestId('charts')).toBeNull();
  });

  it('mantem os numeros anteriores rotulados quando a atualizacao falha', () => {
    useQueueMetricsMock.mockReturnValue({ ...baseState, error: 'timeout', hasLoaded: true });

    render(<QueueMetricsDashboard />);

    expect(screen.getByText(/última leitura bem-sucedida \(03:00:00\)/)).toBeInTheDocument();
    expect(screen.getByTestId('metric-cards')).toBeInTheDocument();
  });

  it('nao mostra erro quando a leitura funciona', () => {
    useQueueMetricsMock.mockReturnValue({ ...baseState });

    render(<QueueMetricsDashboard />);

    expect(screen.queryByText('Não foi possível carregar as métricas')).toBeNull();
    expect(screen.getByTestId('metric-cards')).toBeInTheDocument();
  });
});
