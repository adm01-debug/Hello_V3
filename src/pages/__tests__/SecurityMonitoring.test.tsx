import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const { useMonitoringMock } = vi.hoisted(() => ({ useMonitoringMock: vi.fn() }));

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ profile: { email: 'admin@x.com', role: 'admin' }, loading: false }) }));
vi.mock('@/hooks/useSecurityMonitoringData', () => ({ useSecurityMonitoringData: useMonitoringMock }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: vi.fn() } }));

import SecurityMonitoring from '../SecurityMonitoring';

const base = {
  recentLogs: [],
  alerts: [],
  stats: { totalEvents: 0, viewEvents: 0, exportEvents: 0, downloadEvents: 0, uniqueUsers: 0, criticalAlerts: 0 },
  isLive: true,
  setIsLive: vi.fn(),
  fetchData: vi.fn(),
  resolveAlert: vi.fn(),
  error: null as string | null,
};

describe('SecurityMonitoring', () => {
  it('distingue "sem eventos" de "nao consegui ler"', () => {
    // A-009: lista vazia por falha de consulta nao pode ser lida como
    // tranquilidade num painel de seguranca.
    useMonitoringMock.mockReturnValue({ ...base, error: 'timeout' });

    render(<SecurityMonitoring />);

    expect(screen.getByText('Monitoramento indisponível')).toBeInTheDocument();
    expect(screen.getByText(/timeout/)).toBeInTheDocument();
    expect(screen.getByText(/Não foi possível carregar os eventos/)).toBeInTheDocument();
    // Os cartoes de numero nao mentem "0": mostram que nao ha leitura.
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.queryByText('Nenhum evento registrado')).toBeNull();
  });

  it('mostra os estados vazios normais quando a leitura funciona', () => {
    useMonitoringMock.mockReturnValue({ ...base });

    render(<SecurityMonitoring />);

    expect(screen.queryByText('Monitoramento indisponível')).toBeNull();
    expect(screen.getByText('Nenhum evento registrado')).toBeInTheDocument();
  });
});
