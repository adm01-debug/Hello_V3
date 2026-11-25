import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Insercao controlada: a promise so resolve quando o teste manda, o que deixa a
// janela de duplo clique aberta de proposito.
const h = vi.hoisted(() => {
  let resolver: (v: { error: null }) => void = () => {};
  const insert = vi.fn(
    () => new Promise<{ error: null }>((resolve) => { resolver = resolve; }),
  );
  return { insert, liberar: () => resolver({ error: null }) };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(() => ({ insert: h.insert })) },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { BattleCardAlert } from '../BattleCardAlert';
import type { BattleCard } from '@/hooks/useBattleCardDetection';

const card: BattleCard = {
  id: 'bc1',
  competitor_name: 'Concorrente X',
  description: null,
  our_strengths: ['Preco'],
  their_weaknesses: [],
  talking_points: [],
  objection_responses: [],
  is_active: true,
};

describe('BattleCardAlert - duplo clique (etapa 218)', () => {
  beforeEach(() => {
    h.insert.mockClear();
  });

  it('registra o uso uma unica vez quando o botao e clicado duas vezes rapido', async () => {
    render(<BattleCardAlert card={card} onDismiss={vi.fn()} callSessionId="sess-1" agentName="Ana" />);

    const botao = screen.getByRole('button', { name: /Marcar como usado/i });
    fireEvent.click(botao);
    fireEvent.click(botao);

    expect(h.insert).toHaveBeenCalledTimes(1);

    h.liberar();
    await waitFor(() => expect(screen.getByRole('button', { name: /Registrado/i })).toBeInTheDocument());
    expect(h.insert).toHaveBeenCalledTimes(1);
  });

  it('nao reabre a insercao depois de registrado', async () => {
    render(<BattleCardAlert card={card} onDismiss={vi.fn()} callSessionId="sess-2" />);

    const botao = screen.getByRole('button', { name: /Marcar como usado/i });
    fireEvent.click(botao);
    h.liberar();

    await waitFor(() => expect(screen.getByRole('button', { name: /Registrado/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Registrado/i }));

    expect(h.insert).toHaveBeenCalledTimes(1);
  });
});