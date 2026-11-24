import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const { useSecurityDashboardMock, loadMock } = vi.hoisted(() => ({
  useSecurityDashboardMock: vi.fn(),
  loadMock: vi.fn(),
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuthContext: () => ({ user: { id: 'u1' } }) }));
vi.mock('@/components/security/NotificationPermissionBanner', () => ({ NotificationPermissionBanner: () => <div /> }));
vi.mock('@/hooks/useSecurityDashboard', () => ({ useSecurityDashboard: useSecurityDashboardMock }));

import SecurityDashboard from '../SecurityDashboard';

const base = {
  securityScore: { total: 95, mfa: 40, sessions: 20, ipRestriction: 25, recentActivity: 10 },
  recentAlerts: [],
  blockedAccess: 3,
  ipRestrictionEnabled: true,
  isLoading: false,
  error: null as string | null,
  sessions: [],
  currentSessionId: 's0',
  sessionDurationHours: 24,
  mfaSettings: { mfa_enabled: true },
  mfaLoading: false,
  loadSecurityData: loadMock,
};

describe('SecurityDashboard', () => {
  it('alarma "monitoramento indisponivel" e esconde a pontuacao quando a leitura falha', () => {
    // A-009: painel de seguranca que nao sabe o que acontece tem de dizer isso
    // em destaque — e nao mostrar 0/100 como se a conta estivesse desprotegida.
    useSecurityDashboardMock.mockReturnValue({ ...base, error: 'permission denied for table security_alerts', securityScore: { total: 0, mfa: 0, sessions: 0, ipRestriction: 0, recentActivity: 0 } });

    render(<SecurityDashboard />);

    expect(screen.getAllByText('Monitoramento indisponível').length).toBeGreaterThan(0);
    expect(screen.getByText(/permission denied for table security_alerts/)).toBeInTheDocument();
    expect(screen.queryByText('Pontuação:')).toBeNull();
    expect(screen.queryByText('Nenhum alerta recente')).toBeNull();
  });

  it('mostra a pontuacao normal quando a leitura funciona', () => {
    useSecurityDashboardMock.mockReturnValue({ ...base });

    render(<SecurityDashboard />);

    expect(screen.queryByText('Monitoramento indisponível')).toBeNull();
    expect(screen.getByText('95')).toBeInTheDocument();
  });
});
