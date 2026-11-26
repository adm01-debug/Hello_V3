import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import type { KbArticleHistoryEntry } from '@/hooks/useKbArticleHistory';

const history = vi.hoisted(() => ({
  current: {
    data: [] as KbArticleHistoryEntry[] | undefined,
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  } as Record<string, unknown>,
}));

vi.mock('@/hooks/useKbArticleHistory', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useKbArticleHistory')>();
  return { ...actual, useKbArticleHistory: () => history.current };
});

import { ArticleHistoryCard } from '@/components/knowledge/ArticleHistoryCard';

const createEntry: KbArticleHistoryEntry = {
  id: 'h1',
  article_id: 'a1',
  changed_by: null,
  previous_title: null,
  new_title: 'Como abrir chamado',
  previous_content: null,
  new_content: 'Passo 1: abrir o painel',
  change_type: 'create',
  created_at: '2026-11-26T10:00:00.000Z',
};

const updateEntry: KbArticleHistoryEntry = {
  id: 'h2',
  article_id: 'a1',
  changed_by: '12345678-90ab-cdef-1234-567890abcdef',
  previous_title: 'Titulo antigo',
  new_title: 'Titulo novo',
  previous_content: 'conteudo antigo',
  new_content: 'conteudo novo',
  change_type: 'status_change',
  created_at: '2026-11-26T11:00:00.000Z',
};

beforeEach(() => {
  history.current = {
    data: [],
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  };
});

describe('ArticleHistoryCard', () => {
  it('mostra carregamento enquanto a leitura nao termina', () => {
    history.current = { ...history.current, data: undefined, isLoading: true, isFetching: true };
    render(<ArticleHistoryCard articleId="a1" />);
    expect(screen.getByText('Carregando histórico...')).toBeInTheDocument();
  });

  it('explica o vazio em vez de deixar a area muda', () => {
    render(<ArticleHistoryCard articleId="a1" />);
    expect(
      screen.getByText(/Nenhuma versão registrada/i),
    ).toBeInTheDocument();
  });

  it('mostra erro e permite tentar de novo', () => {
    const refetch = vi.fn();
    history.current = { ...history.current, data: undefined, isError: true, refetch };
    render(<ArticleHistoryCard articleId="a1" />);
    expect(screen.getByText('Não foi possível ler o histórico de versões agora.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('lista a criacao do artigo com autor do sistema', () => {
    history.current = { ...history.current, data: [createEntry] };
    render(<ArticleHistoryCard articleId="a1" />);
    expect(screen.getByText('Criação')).toBeInTheDocument();
    expect(screen.getByText('por sistema')).toBeInTheDocument();
  });

  it('mostra a troca de titulo e o autor encurtado', () => {
    history.current = { ...history.current, data: [updateEntry] };
    render(<ArticleHistoryCard articleId="a1" />);
    expect(screen.getByText('Mudança de status')).toBeInTheDocument();
    expect(screen.getByText('por 12345678...')).toBeInTheDocument();
    expect(screen.getByText(/Título:/)).toBeInTheDocument();
  });

  it('abre o antes e depois do conteudo sob demanda', () => {
    history.current = { ...history.current, data: [updateEntry] };
    render(<ArticleHistoryCard articleId="a1" />);
    expect(screen.queryByText('Antes')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ver o que mudou' }));

    expect(screen.getByText('Antes')).toBeInTheDocument();
    expect(screen.getByText('Depois')).toBeInTheDocument();
    expect(screen.getByText('conteudo antigo')).toBeInTheDocument();
    expect(screen.getByText('conteudo novo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ocultar o que mudou' })).toBeInTheDocument();
  });

  it('avisa que a leitura e restrita a administradores e supervisores', () => {
    render(<ArticleHistoryCard articleId="a1" />);
    expect(screen.getByText('Visível apenas para administradores e supervisores.')).toBeInTheDocument();
  });
});