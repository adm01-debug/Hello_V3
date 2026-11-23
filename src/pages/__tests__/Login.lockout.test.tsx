import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const signIn = vi.fn(async () => ({ data: { user: { id: 'u1' } }, error: null }));
const signOut = vi.fn(async () => undefined);
const rpc = vi.fn();
const toastError = vi.fn();

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: (...a: unknown[]) => toastError(...a), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => ({ signIn, signOut, isAuthenticated: false, loading: false }),
}));
vi.mock('@/hooks/useIPValidation', () => ({ useIPValidation: () => ({ validateIP: vi.fn(async () => ({ allowed: true })) }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: (...a: unknown[]) => rpc(...a), functions: { invoke: vi.fn() } },
}));
vi.mock('@/components/auth/PasskeyLogin', () => ({ PasskeyLogin: () => null }));
vi.mock('@/components/auth/LoginBranding', () => ({ LoginBranding: () => null }));
vi.mock('@/lib/webauthn/webauthn-utils', () => ({ isWebAuthnSupported: () => false }));
vi.mock('@/integrations/lovable/index', () => ({ lovable: { auth: { signInWithOAuth: vi.fn() } } }));

import Login from '@/pages/Login';

async function renderLogin() {
  await act(async () => {
    render(<MemoryRouter><Login /></MemoryRouter>);
  });
}

async function submit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: password } });
  fireEvent.submit(screen.getByLabelText('Email').closest('form')!);
}

describe('Login — bloqueio de força bruta falha fechado (E003)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({ ip: '203.0.113.9', country_name: 'Brasil', city: 'São Paulo', country_code: 'BR' }) })) as unknown as typeof fetch);
  });

  it('quando a verificação de bloqueio falha, não tenta autenticar', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'rpc unavailable' } });

    await renderLogin();
    await submit('agente@teste.com', 'senha123');

    await waitFor(() => expect(toastError).toHaveBeenCalledWith(
      'Não foi possível verificar a segurança da conta',
      expect.objectContaining({ description: expect.stringContaining('Tente novamente') }),
    ));
    expect(signIn).not.toHaveBeenCalled();
  });

  it('quando a verificação responde "não bloqueado", o login segue', async () => {
    rpc.mockResolvedValue({ data: { locked: false, attempts: 0 }, error: null });

    await renderLogin();
    await submit('agente@teste.com', 'senha123');

    await waitFor(() => expect(signIn).toHaveBeenCalledWith('agente@teste.com', 'senha123'));
  });
});
