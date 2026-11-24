import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const navigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}));

vi.mock('@/hooks/useDashboardData', () => ({
  useRecentCallsData: () => ({
    isLoading: false,
    data: [
      {
        id: 'sess-1',
        caller_name: 'Ana Souza',
        caller_phone: '5511999999999',
        status: 'completed',
        duration_seconds: 65,
        started_at: new Date().toISOString(),
      },
    ],
  }),
}));

import { RecentCalls } from '../RecentCalls';

describe('RecentCalls — navegacao (etapa 165)', () => {
  beforeEach(() => navigate.mockClear());

  it('"Ver todas" abre o historico de chamadas', () => {
    render(<RecentCalls />);

    fireEvent.click(screen.getByRole('button', { name: 'Ver todas' }));

    expect(navigate).toHaveBeenCalledWith('/history');
  });

  it('"Mais opcoes" nao e mais um botao morto: tem rotulo acessivel por chamada', () => {
    render(<RecentCalls />);

    expect(
      screen.getByRole('button', { name: 'Mais opções da chamada de Ana Souza' }),
    ).toBeInTheDocument();
  });
});