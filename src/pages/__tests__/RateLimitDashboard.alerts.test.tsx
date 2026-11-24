import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RateLimitDashboard from '../RateLimitDashboard';

const data = {
  isLoading: false,
  alerts: [
    { id: 'a1', ip_address: '10.0.0.9', endpoint: '/api/x', request_count: 900, threshold: 600, severity: 'critical', is_resolved: false, created_at: '2026-11-20T10:00:00Z' },
  ],
  settings: [],
  searchTerm: '',
  setSearchTerm: vi.fn(),
  refreshing: false,
  stats: { totalRequests: 1000, blockedIPs: 1, activeAlerts: 1, requestsLast24h: 20 },
  chartData: [],
  filteredLogs: [],
  refresh: vi.fn(),
  resolveAlert: vi.fn(),
  unblockIP: vi.fn(),
  cleanOldLogs: vi.fn(),
};

vi.mock('@/hooks/useRateLimitData', () => ({ useRateLimitData: () => data }));
vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: () => {} }));
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

describe('RateLimitDashboard — "Ver Alertas" (etapa 167)', () => {
  it('abre a lista de alertas na propria tela, sem perder o contexto do incidente', () => {
    render(<RateLimitDashboard />);

    expect(screen.queryByText('Alertas de Rate Limit')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ver Alertas' }));

    expect(screen.getByText('Alertas de Rate Limit')).toBeInTheDocument();
    expect(screen.getByText('10.0.0.9')).toBeInTheDocument();
  });
});