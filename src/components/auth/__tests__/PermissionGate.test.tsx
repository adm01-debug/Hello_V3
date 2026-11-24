import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const perms = vi.hoisted(() => ({
  loading: false,
  hasPermission: vi.fn(),
  hasAnyPermission: vi.fn(),
  hasAllPermissions: vi.fn(),
  canAccess: vi.fn(),
}));

vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => perms }));

import { PermissionGate } from '@/components/auth/PermissionGate';

describe('PermissionGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    perms.loading = false;
  });

  it('nao renderiza nada enquanto as permissoes carregam', () => {
    perms.loading = true;
    render(<PermissionGate permission="x"><span>conteudo</span></PermissionGate>);
    expect(screen.queryByText('conteudo')).toBeNull();
    expect(screen.queryByText('Sem permissão para acessar')).toBeNull();
  });

  it('mostra o estado padrao de sem permissao quando nao ha fallback', () => {
    perms.hasPermission.mockReturnValue(false);
    render(<PermissionGate permission="x"><span>conteudo</span></PermissionGate>);
    expect(screen.queryByText('conteudo')).toBeNull();
    expect(screen.getByText('Sem permissão para acessar')).toBeInTheDocument();
  });

  it('respeita fallback explicito, inclusive null', () => {
    perms.hasPermission.mockReturnValue(false);
    const { unmount } = render(
      <PermissionGate permission="x" fallback={null}><span>conteudo</span></PermissionGate>,
    );
    expect(screen.queryByText('Sem permissão para acessar')).toBeNull();
    unmount();

    render(
      <PermissionGate permission="x" fallback={<span>sem acesso</span>}><span>conteudo</span></PermissionGate>,
    );
    expect(screen.getByText('sem acesso')).toBeInTheDocument();
  });

  it('renderiza os filhos quando o modulo libera e quando nao se pede permissao', () => {
    perms.canAccess.mockReturnValue(true);
    render(<PermissionGate module="coaching" action="manage"><span>modulo</span></PermissionGate>);
    expect(screen.getByText('modulo')).toBeInTheDocument();

    render(<PermissionGate><span>aberto</span></PermissionGate>);
    expect(screen.getByText('aberto')).toBeInTheDocument();
  });

  it('usa requireAll na checagem por lista de permissoes', () => {
    perms.hasAllPermissions.mockReturnValue(true);
    render(<PermissionGate permissions={['a', 'b']} requireAll><span>todas</span></PermissionGate>);
    expect(screen.getByText('todas')).toBeInTheDocument();
    expect(perms.hasAllPermissions).toHaveBeenCalledWith(['a', 'b']);
  });
});