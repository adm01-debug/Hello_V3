import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Status from '../Status';
import { supabase } from '@/integrations/supabase/client';

// Mock por tabela: voip_trunk_health_checks e webhook_flush_metrics
const tableData: Record<string, unknown[]> = {};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn((table: string) => ({
    select: vi.fn().mockReturnValue({
      gte: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data: tableData[table] ?? [], error: null }),
      }),
    }),
  })) },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <Status />
    </MemoryRouter>
  );
}

describe('Status — sem medição (E092)', () => {
  beforeEach(() => { tableData.voip_trunk_health_checks = []; tableData.webhook_flush_metrics = []; });

  it('mostra "Sem medição" quando as tabelas estão vazias', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/Sem medição no período/i)).toBeInTheDocument());
    expect(screen.getAllByText('Sem medição').length).toBeGreaterThan(0);
  });

  it('mostra "Todos os sistemas operacionais" quando há amostras saudáveis', async () => {
    tableData.voip_trunk_health_checks = [{ checked_at: new Date().toISOString(), reachable: true }];
    tableData.webhook_flush_metrics = [{ created_at: new Date().toISOString(), sent: 1, failed: 0 }];
    renderPage();
    await waitFor(() => expect(screen.getByText(/Todos os sistemas operacionais/i)).toBeInTheDocument());
  });
});

describe('Status — erro no carregamento (E093)', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('sai do spinner e mostra mensagem de erro quando a consulta falha', async () => {
    // força erro na primeira tabela (trunk)
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'Falha de RLS' } }),
        }),
      }),
    } as never);
    renderPage();
    await waitFor(() => expect(screen.getByText(/Não foi possível carregar o status/i)).toBeInTheDocument());
  });
});
