import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '../AppSidebar';
import { routeRoles } from '@/routes/protectedRoutes';

const authMock = vi.hoisted(() => ({ profile: null as { role: string } | null }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ insert: vi.fn().mockResolvedValue({ error: null }) }) },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => ({
    user: null,
    session: null,
    profile: authMock.profile,
    loading: false,
    error: null,
    isAuthenticated: true,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    hasRole: (roles: string[]) => authMock.profile ? roles.includes(authMock.profile.role) : false,
  }),
}));

vi.mock('@/hooks/useUnreadConflicts', () => ({
  useUnreadConflicts: () => ({ data: 0 }),
}));

vi.mock('@/lib/route-prefetch', () => ({
  prefetchHandlers: () => ({}),
}));

function renderSidebar() {
  return render(
    <SidebarProvider>
      <MemoryRouter>
        <AppSidebar />
      </MemoryRouter>
    </SidebarProvider>
  );
}

function openGroup(label: string) {
  fireEvent.click(screen.getByText(label));
}

describe('routeRoles (E088)', () => {
  it('declara papéis para rota admin e undefined para rota aberta', () => {
    expect(routeRoles['/audit-logs']).toEqual(['admin']);
    expect(routeRoles['/executive']).toEqual(['supervisor', 'admin']);
    expect(routeRoles['/contacts']).toBeUndefined();
  });
});

describe('AppSidebar — filtro por papel (E089)', () => {
  beforeEach(() => { authMock.profile = null; });

  it('agente não vê itens de rota com roles (Executivo, Logs de Auditoria)', () => {
    authMock.profile = { role: 'agent' };
    renderSidebar();
    expect(screen.queryByText('Executivo')).not.toBeInTheDocument();
    expect(screen.queryByText('Logs de Auditoria')).not.toBeInTheDocument();
    // Grupo Administração inteiro some para agente (todos os itens são admin)
    expect(screen.queryByText('Administração')).not.toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('supervisor vê Executivo mas não Logs de Auditoria', () => {
    authMock.profile = { role: 'supervisor' };
    renderSidebar();
    expect(screen.getByText('Executivo')).toBeInTheDocument();
    expect(screen.queryByText('Logs de Auditoria')).not.toBeInTheDocument();
  });

  it('admin vê Executivo e Logs de Auditoria', () => {
    authMock.profile = { role: 'admin' };
    renderSidebar();
    expect(screen.getByText('Executivo')).toBeInTheDocument();
    // "Logs de Auditoria" fica no grupo "Sistema" (collapsible), abrir para ver
    openGroup('Sistema');
    expect(screen.getByText('Logs de Auditoria')).toBeInTheDocument();
  });
});
