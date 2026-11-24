import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// `vi.hoisted` evita a TDZ: o factory dos mocks roda antes das declarações do
// arquivo, então o estado compartilhado precisa existir antes dele.
const sessionState = vi.hoisted(() => ({ expired: false }));

vi.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => ({ isAuthenticated: false, loading: false, hasRole: () => false }),
}));

vi.mock('@/contexts/SessionExpiryContext', () => ({
  useSessionExpiry: () => ({
    expired: sessionState.expired,
    busy: false,
    reauthenticate: async () => null,
    abandon: () => {},
  }),
}));

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/login" element={<p>tela de login</p>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <input aria-label="rascunho" defaultValue="texto do cliente" />
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute com sessão expirada', () => {
  beforeEach(() => {
    sessionState.expired = false;
  });

  it('redireciona para /login quando o usuário não está autenticado', () => {
    renderRoute();
    expect(screen.getByText('tela de login')).toBeInTheDocument();
    expect(screen.queryByLabelText('rascunho')).not.toBeInTheDocument();
  });

  it('mantém a tela montada enquanto o diálogo de sessão expirada está aberto', () => {
    sessionState.expired = true;
    renderRoute();
    expect(screen.getByLabelText('rascunho')).toHaveValue('texto do cliente');
    expect(screen.queryByText('tela de login')).not.toBeInTheDocument();
  });
});
