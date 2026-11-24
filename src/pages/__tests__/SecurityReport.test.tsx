import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SecurityReport from '../SecurityReport';
import { securityFeatures } from '@/lib/security-report-data';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: { role: 'admin' }, loading: false }),
}));
vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: rpcMock } }));

function renderPage() {
  return render(<MemoryRouter><SecurityReport /></MemoryRouter>);
}

describe('SecurityReport — catalogo com origem declarada (E172)', () => {
  beforeEach(() => {
    rpcMock.mockResolvedValue({
      data: [{ table_name: 'contacts', rls_enabled: true }, { table_name: 'deals', rls_enabled: false }],
      error: null,
    });
  });

  it('nao exibe mais o KPI de features como indicador', () => {
    renderPage();
    expect(screen.queryByText('Features de Segurança')).toBeNull();
  });

  it('declara a origem de cada controle listado', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Ativo')).toBeInTheDocument());
    const origens = screen.getAllByText(/^Origem: /);
    expect(origens).toHaveLength(securityFeatures.length);
    expect(screen.getByText('Origem: Medido nesta tela pela RPC check_all_tables_rls_status')).toBeInTheDocument();
    expect(screen.getByText(/Nao verificado: depende de ativacao no painel do Supabase/)).toBeInTheDocument();
  });

  it('a cobertura de RLS continua sendo medida pela RPC', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/^50%$/)).toBeInTheDocument());
    expect(rpcMock).toHaveBeenCalledWith('check_all_tables_rls_status');
  });
});
