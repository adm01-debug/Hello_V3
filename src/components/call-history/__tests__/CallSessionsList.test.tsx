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

  it('explica o vazio quando a leitura funcionou', () => {
    render(<CallSessionsList {...base} error={null} />);

    expect(screen.getByText('Nenhuma chamada no período')).toBeInTheDocument();
    expect(screen.getByText(/assim que a primeira ligação termina/)).toBeInTheDocument();
    expect(screen.queryByText('Não foi possível carregar as chamadas')).toBeNull();
  });

  it('com filtros aplicados, diz que o filtro esconde resultados e oferece limpar', () => {
    render(<CallSessionsList {...base} error={null} activeFiltersCount={2} />);

    expect(screen.getByText('Nenhuma chamada com esses filtros')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Limpar filtros' })).toBeInTheDocument();
  });
});