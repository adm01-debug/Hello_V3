import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const refetchMock = vi.fn();

const hookState: {
  data: unknown[];
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => void;
} = {
  data: [],
  isLoading: false,
  isError: false,
  isFetching: false,
  refetch: () => refetchMock(),
};

vi.mock('@/hooks/useRedactionLog', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useRedactionLog')>(
    '@/hooks/useRedactionLog',
  );
  return {
    ...actual,
    useRedactionLog: () => hookState,
  };
});

import { RedactionLogCard } from '@/components/voice-security/RedactionLogCard';

const baseEntry = {
  id: 'log-1',
  call_session_id: '11111111-2222-3333-4444-555555555555',
  pattern_type: 'cpf,card',
  match_count: 3,
  segments: [{ start: 1.5, pattern: 'cpf' }],
  status: 'completed',
  error_message: null,
  created_at: '2026-11-26T10:00:00Z',
};

beforeEach(() => {
  hookState.data = [baseEntry];
  hookState.isLoading = false;
  hookState.isError = false;
  hookState.isFetching = false;
  refetchMock.mockReset();
});

describe('RedactionLogCard', () => {
  it('mostra o estado vazio quando nao ha execucao registrada', () => {
    hookState.data = [];
    render(<RedactionLogCard />);
    expect(screen.getByText(/Nenhuma redacao registrada ainda/i)).toBeTruthy();
  });

  it('lista a execucao com sessao abreviada, padroes e ocorrencias', () => {
    render(<RedactionLogCard />);
    expect(screen.getByText('11111111...')).toBeTruthy();
    expect(screen.getByText('cpf')).toBeTruthy();
    expect(screen.getByText('card')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('Concluida')).toBeTruthy();
  });

  it('explica o total de ocorrencias no cabecalho', () => {
    hookState.data = [baseEntry, { ...baseEntry, id: 'log-2', match_count: 2 }];
    render(<RedactionLogCard />);
    expect(screen.getByText(/5 ocorrencia\(s\) sensivel\(is\) no total/)).toBeTruthy();
  });

  it('mostra "nenhum padrao" quando a edge gravou pattern_type "none"', () => {
    hookState.data = [
      { ...baseEntry, pattern_type: 'none', match_count: 0, segments: [], status: 'no_matches' },
    ];
    render(<RedactionLogCard />);
    expect(screen.getByText(/nenhum padrao/i)).toBeTruthy();
    expect(screen.getByText('Sem ocorrencias')).toBeTruthy();
  });

  it('abre e fecha os segmentos marcados', () => {
    render(<RedactionLogCard />);
    const toggle = screen.getByRole('button', { name: /Ver segmentos sensiveis de 11111111/i });
    fireEvent.click(toggle);
    expect(screen.getByText('Segmentos marcados')).toBeTruthy();
    expect(screen.getByText(/"pattern": "cpf"/)).toBeTruthy();
    fireEvent.click(toggle);
    expect(screen.queryByText('Segmentos marcados')).toBeNull();
  });

  it('mostra o erro de leitura com botao de nova tentativa', async () => {
    hookState.isError = true;
    render(<RedactionLogCard />);
    expect(screen.getByText(/Nao foi possivel ler o log de redacoes agora/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await waitFor(() => expect(refetchMock).toHaveBeenCalledTimes(1));
  });

  it('mostra status desconhecido cru, sem esconder a linha', () => {
    hookState.data = [{ ...baseEntry, status: 'pending', match_count: 0 }];
    render(<RedactionLogCard />);
    expect(screen.getByText('pending')).toBeTruthy();
  });

  it('atualiza o historico ao clicar em Atualizar', async () => {
    render(<RedactionLogCard />);
    fireEvent.click(screen.getByRole('button', { name: /Atualizar historico de redacoes/i }));
    await waitFor(() => expect(refetchMock).toHaveBeenCalledTimes(1));
  });
});