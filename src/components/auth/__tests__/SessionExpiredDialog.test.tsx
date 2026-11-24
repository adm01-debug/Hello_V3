import { useEffect, useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

const signIn = vi.fn();
const signOut = vi.fn();
const refreshSession = vi.fn();

// Estado mutável: o supabase-js derruba a sessão (SIGNED_OUT) quando o refresh
// token também venceu, e é esse momento que precisa manter a rota montada.
const authState = {
  user: { id: 'u1', email: 'ana@empresa.com' } as { id: string; email: string } | null,
  isAuthenticated: true,
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => ({
    ...authState,
    loading: false,
    profile: null,
    hasRole: () => true,
    signIn,
    signOut,
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { auth: { refreshSession: (...args: unknown[]) => refreshSession(...args) } },
}));

import { SessionExpiryProvider } from '@/contexts/SessionExpiryContext';
import { SessionExpiredDialog } from '@/components/auth/SessionExpiredDialog';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SESSION_EXPIRED_EVENT, notifySessionExpired } from '@/lib/session-expiry';

// Formulário com rascunho: a prova da etapa é que o texto digitado sobrevive
// ao 401 e à reautenticação.
function EditorComRascunho() {
  const [texto, setTexto] = useState('');
  return (
    <input aria-label="rascunho" value={texto} onChange={(event) => setTexto(event.target.value)} />
  );
}

// O AuthContext real é estado do React: quando o supabase-js emite SIGNED_OUT
// ele re-renderiza. O mock é um objeto simples, então reproduzimos esse
// re-render para que a decisão do ProtectedRoute seja de fato exercitada.
function RotaProtegida() {
  const [, tick] = useState(0);
  useEffect(() => {
    const onSessionEvent = () => tick((value) => value + 1);
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionEvent);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionEvent);
  }, []);

  return (
    <ProtectedRoute>
      <EditorComRascunho />
    </ProtectedRoute>
  );
}

function renderApp() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SessionExpiryProvider>
          <RotaProtegida />
          <SessionExpiredDialog />
        </SessionExpiryProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('sessão expirada', () => {
  beforeEach(() => {
    signIn.mockReset();
    signOut.mockReset();
    refreshSession.mockReset();
    authState.user = { id: 'u1', email: 'ana@empresa.com' };
    authState.isAuthenticated = true;
  });

  it('mantém o formulário preenchido e reautentica sem sair da tela', async () => {
    refreshSession.mockResolvedValue({ data: { session: null }, error: { message: 'invalid refresh token' } });
    signIn.mockImplementation(async () => {
      authState.isAuthenticated = true;
      return { data: { user: { id: 'u1' }, session: null }, error: null };
    });

    renderApp();
    fireEvent.change(screen.getByLabelText('rascunho'), { target: { value: 'texto do cliente' } });

    // O refresh falhou, então o supabase-js emite SIGNED_OUT: o AuthContext
    // passa a `false` e, sem o tratamento desta etapa, a rota caía para /login.
    authState.isAuthenticated = false;
    await act(async () => {
      notifySessionExpired();
    });

    expect(await screen.findByText('Sua sessão expirou')).toBeInTheDocument();
    expect(screen.getByLabelText('rascunho')).toHaveValue('texto do cliente');

    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-secreta' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar novamente/i }));

    await waitFor(() => expect(signIn).toHaveBeenCalledWith('ana@empresa.com', 'senha-secreta'));
    await waitFor(() => expect(screen.queryByText('Sua sessão expirou')).not.toBeInTheDocument());
    expect(screen.getByLabelText('rascunho')).toHaveValue('texto do cliente');
  });

  it('mostra o erro de credencial e mantém o diálogo aberto', async () => {
    refreshSession.mockResolvedValue({ data: { session: null }, error: { message: 'invalid refresh token' } });
    signIn.mockResolvedValue({ data: { user: null, session: null }, error: new Error('Invalid login credentials') });

    renderApp();
    await act(async () => {
      notifySessionExpired();
    });

    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'errada' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar novamente/i }));

    expect(await screen.findByText('Invalid login credentials')).toBeInTheDocument();
    expect(screen.getByText('Sua sessão expirou')).toBeInTheDocument();
  });

  it('renova sozinho quando o refresh token ainda vale', async () => {
    refreshSession.mockResolvedValue({ data: { session: { access_token: 'novo' } }, error: null });

    renderApp();
    await act(async () => {
      notifySessionExpired();
    });

    await waitFor(() => expect(refreshSession).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByText('Sua sessão expirou')).not.toBeInTheDocument());
    expect(signIn).not.toHaveBeenCalled();
  });
});
