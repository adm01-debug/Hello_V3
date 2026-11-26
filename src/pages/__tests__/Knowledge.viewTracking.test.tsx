import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Knowledge from '../Knowledge';

const article = {
  id: 'a1',
  title: 'Como faturar',
  slug: 'como-faturar',
  excerpt: 'Resumo do artigo',
  content: 'Conteudo completo sobre faturamento',
  status: 'published',
  view_count: 3,
  helpful_count: 1,
  tags: ['billing'],
  updated_at: '2026-11-20T10:00:00Z',
  category_id: null,
};

const state = vi.hoisted(() => ({ recordView: vi.fn() }));

vi.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => ({ profile: { role: 'agent', email: 'agente@empresa.com' } }),
}));
vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: () => {} }));
vi.mock('@/hooks/useKnowledgeBase', () => ({
  useKbCategories: () => ({ data: [] }),
  useKbArticles: () => ({ data: [article], isLoading: false }),
  useKbArticle: (id: string | null) =>
    id ? { data: article, isLoading: false, isError: false, refetch: vi.fn() } : { data: null, isLoading: false, isError: false, refetch: vi.fn() },
  useUpsertArticle: () => ({ mutate: vi.fn(), isPending: false }),
  useRecordKbView: () => ({ mutate: state.recordView }),
}));
vi.mock('@/hooks/useKbArticleHistory', () => ({
  useKbArticleHistory: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
}));

describe('Knowledge — registro de visualizacao (etapa 152)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registra a visualizacao ao abrir o artigo', async () => {
    render(<Knowledge />);
    expect(state.recordView).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Ler artigo Como faturar' }));
    await waitFor(() => expect(state.recordView).toHaveBeenCalledWith({ articleId: 'a1' }));
  });

  it('grava o feedback de utilidade e nao deixa votar duas vezes', async () => {
    render(<Knowledge />);
    fireEvent.click(screen.getByRole('button', { name: 'Ler artigo Como faturar' }));
    await waitFor(() => expect(state.recordView).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Marcar artigo como útil' }));
    await waitFor(() => expect(state.recordView).toHaveBeenCalledWith({ articleId: 'a1', wasHelpful: true }));
    expect((screen.getByRole('button', { name: 'Marcar artigo como útil' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Marcar artigo como não útil' }) as HTMLButtonElement).disabled).toBe(true);
    expect(state.recordView).toHaveBeenCalledTimes(2);
  });
});