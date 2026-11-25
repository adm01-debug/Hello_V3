import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const h = vi.hoisted(() => {
  let liberarInsert: (v: unknown) => void = () => {};
  const insert = vi.fn(() => new Promise((resolve) => { liberarInsert = resolve; }));
  const update = vi.fn(() => ({ eq: () => Promise.resolve({ error: null }) }));
  const state = { rows: [] as Array<Record<string, unknown>> };
  const from = vi.fn(() => ({
    select: () => ({ order: () => Promise.resolve({ data: state.rows, error: null }) }),
    insert,
    update,
  }));
  return { insert, update, from, state, liberar: () => liberarInsert({ error: null }) };
});

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: h.from } }));
vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: () => {} }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));

import VideoConference from '../VideoConference';

const montar = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <VideoConference />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  cleanup();
  h.insert.mockClear();
  h.update.mockClear();
  h.state.rows = [];
  vi.spyOn(window, 'open').mockImplementation(() => null);
});

describe('VideoConference - duplo clique (etapa 218)', () => {
  it('cria uma unica reuniao quando o botao e clicado duas vezes rapido', async () => {
    montar();

    fireEvent.click(screen.getByRole('button', { name: /Nova Reunião/ }));
    fireEvent.change(screen.getByPlaceholderText('Reunião de equipe'), { target: { value: 'Sprint review' } });

    const criar = screen.getByRole('button', { name: 'Criar' });
    act(() => {
      criar.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      criar.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await vi.waitFor(() => expect(h.insert).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(h.insert).toHaveBeenCalledTimes(1);
    h.liberar();
  });

  it('inicia uma unica vez quando o botao de iniciar e tocado duas vezes rapido', async () => {
    h.state.rows = [{ id: 'conf-1', title: 'Daily comercial', status: 'scheduled', meeting_url: null }];
    montar();

    const iniciar = await screen.findByRole('button', { name: 'Iniciar' });
    act(() => {
      iniciar.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      iniciar.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await vi.waitFor(() => expect(h.update).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(h.update).toHaveBeenCalledTimes(1);
  });
});