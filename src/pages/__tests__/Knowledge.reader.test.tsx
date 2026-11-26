import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Knowledge from '../Knowledge';

const article = {
  id: 'a1',
  title: 'Como faturar',
  slug: 'como-faturar',
  excerpt: 'Resumo do artigo',
  content: 'Conteudo completo do artigo sobre faturamento',
  status: 'published',
  view_count: 3,
  helpful_count: 1,
  tags: ['billing'],
  updated_at: '2026-11-20T10:00:00Z',
  category_id: null,
};

let articleQuery: Record<string, unknown>;
const authState = { profile: { role: 'agent', email: 'agente@empresa.com' } };

vi.mock('@/contexts/AuthContext', () => ({ useAuthContext: () => authState }));
vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: () => {} }));
vi.mock('@/hooks/useKnowledgeBase', () => ({
  useKbCategories: () => ({ data: [] }),
  useKbArticles: () => ({ data: [article], isLoading: false }),
  useKbArticle: (id: string | null) => (id ? articleQuery : { data: null, isLoading: false, isError: false, refetch: vi.fn() }),
  useUpsertArticle: () => ({ mutate: vi.fn(), isPending: false }),
  useRecordKbView: () => ({ mutate: vi.fn() }),
}));
vi.mock('@/hooks/useKbArticleHistory', () => ({
  useKbArticleHistory: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
}));

describe('Knowledge — leitura do artigo (etapa 153)', () => {
  beforeEach(() => {
    authState.profile = { role: 'agent', email: 'agente@empresa.com' };
    articleQuery = { data: article, isLoading: false, isError: false, refetch: vi.fn() };
  });

  it('agente abre o conteudo completo do artigo, nao so o resumo', () => {
    render(<Knowledge />);

    expect(screen.queryByText(/Conteudo completo do artigo/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ler artigo Como faturar' }));

    expect(screen.getByRole('heading', { name: 'Como faturar' })).toBeInTheDocument();
    expect(screen.getByText(/Conteudo completo do artigo sobre faturamento/)).toBeInTheDocument();
    // Agente nao edita: nao aparece a acao de edicao.
    expect(screen.queryByRole('button', { name: 'Editar artigo' })).not.toBeInTheDocument();
  });

  it('mostra o erro de carregamento com opcao de tentar de novo', () => {
    articleQuery = { data: undefined, isLoading: false, isError: true, refetch: vi.fn() };
    render(<Knowledge />);

    fireEvent.click(screen.getByRole('button', { name: 'Ler artigo Como faturar' }));

    expect(screen.getByText('Não foi possível carregar o artigo.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });

  it('editor le o artigo e consegue ir para a edicao a partir dele', () => {
    authState.profile = { role: 'admin', email: 'admin@empresa.com' };
    render(<Knowledge />);

    fireEvent.click(screen.getByRole('button', { name: 'Ler artigo Como faturar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Editar artigo' }));

    expect(screen.getByRole('heading', { name: 'Editar artigo' })).toBeInTheDocument();
  });
});