import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useIPWhitelist } from '@/hooks/useIPWhitelist';
import IPWhitelist from '../IPWhitelist';

vi.mock('@/contexts/AuthContext', () => ({ useAuthContext: vi.fn() }));
vi.mock('@/hooks/useIPWhitelist', () => ({ useIPWhitelist: vi.fn() }));
vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));

import { useAuthContext } from '@/contexts/AuthContext';

const baseHook = {
  globalIPs: [] as unknown[],
  userRestrictions: [] as unknown[],
  blockedLogs: [] as unknown[],
  users: [] as unknown[],
  userIPs: [] as unknown[],
  error: null as string | null,
  addGlobalIP: vi.fn(),
  removeGlobalIP: vi.fn(),
  toggleUserRestriction: vi.fn(),
  fetchUserIPs: vi.fn(),
  addUserIP: vi.fn(),
  removeUserIP: vi.fn(),
};

describe('IPWhitelist', () => {
  beforeEach(() => {
    vi.mocked(useAuthContext).mockReturnValue({ hasRole: () => true } as unknown as ReturnType<typeof useAuthContext>);
    vi.mocked(useIPWhitelist).mockReturnValue({ ...baseHook } as unknown as ReturnType<typeof useIPWhitelist>);
  });

  it('alerts when the whitelist could not be read', () => {
    vi.mocked(useIPWhitelist).mockReturnValue({ ...baseHook, error: 'permission denied' } as unknown as ReturnType<typeof useIPWhitelist>);
    render(<IPWhitelist />);

    expect(screen.getByText('Não foi possível carregar a whitelist')).toBeInTheDocument();
    expect(screen.getByText('permission denied')).toBeInTheDocument();
    expect(screen.queryByText('Nenhum IP na whitelist global.')).not.toBeInTheDocument();
  });

  it('shows the genuine empty state when the read succeeded', () => {
    render(<IPWhitelist />);

    expect(screen.getByText('Nenhum IP na whitelist global.')).toBeInTheDocument();
    expect(screen.queryByText('Não foi possível carregar a whitelist')).not.toBeInTheDocument();
  });

  it('does not present an empty user table as "no restriction configured" on failure', () => {
    vi.mocked(useIPWhitelist).mockReturnValue({ ...baseHook, error: 'timeout' } as unknown as ReturnType<typeof useIPWhitelist>);
    render(<IPWhitelist />);

    fireEvent.mouseDown(screen.getByRole('tab', { name: /Restrições por Usuário/ }));
    expect(screen.getByText('Não foi possível carregar os usuários.')).toBeInTheDocument();
  });

  it('grava um único IP quando o botão é clicado duas vezes antes da resposta', async () => {
    let resolveAdd: (value: boolean) => void = () => {};
    const addGlobalIP = vi.fn(
      () => new Promise<boolean>((resolve) => { resolveAdd = resolve; }),
    );
    vi.mocked(useIPWhitelist).mockReturnValue({ ...baseHook, addGlobalIP } as unknown as ReturnType<typeof useIPWhitelist>);
    render(<IPWhitelist />);

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar IP' }));
    fireEvent.change(screen.getByPlaceholderText('192.168.1.100'), { target: { value: '10.0.0.5' } });

    const confirmButton = screen.getByRole('button', { name: 'Adicionar' });
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    expect(addGlobalIP).toHaveBeenCalledTimes(1);
    expect(addGlobalIP).toHaveBeenCalledWith('10.0.0.5', '', false);

    resolveAdd(true);
    await waitFor(() => expect(screen.queryByText('Adicionar IP à Whitelist Global')).not.toBeInTheDocument());
    expect(addGlobalIP).toHaveBeenCalledTimes(1);
  });
});
