import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/a11y-clickable', () => ({ activateOnKey: vi.fn() }));

import { CallSessionsList } from '../CallSessionsList';

const base = {
  sessions: [],
  isLoading: false,
  activeFiltersCount: 0,
  onSessionClick: vi.fn(),
  onClearFilters: vi.fn(),
};

describe('CallSessionsList', () => {
  it('avisa que a leitura falhou em vez de dizer que nao ha chamada', () => {
    render(<CallSessionsList {...base} error="timeout na consulta" />);

    expect(screen.getByText('Não foi possível carregar as chamadas')).toBeInTheDocument();
    expect(screen.getByText(/não é o mesmo que não haver chamada/)).toBeInTheDocument();
    expect(screen.getByText('timeout na consulta')).toBeInTheDocument();
    expect(screen.queryByText('Nenhuma chamada encontrada')).toBeNull();
  });

  it('mostra o vazio normal quando a leitura funcionou', () => {
    render(<CallSessionsList {...base} error={null} />);

    expect(screen.getByText('Nenhuma chamada encontrada')).toBeInTheDocument();
    expect(screen.queryByText('Não foi possível carregar as chamadas')).toBeNull();
  });
});