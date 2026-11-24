// Etapa 170 - o painel admin nao declara meta propria: exibe a que a edge devolve.
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const invokeResult: { current: { data: unknown; error: unknown } } = {
  current: { data: null, error: null },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
    create: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  },
}));

import SloDashboard from '@/pages/admin/SloDashboard';
import { supabase } from '@/integrations/supabase/client';

const budget = { status: 'healthy', remaining_pct: 100, burn_rate: 0, tolerance_pct: 0.1 };

function snapshotCom(slo_targets?: Record<string, number>) {
  return {
    status: 'operational',
    components: {
      trunks: { status: 'operational', uptime_pct: 100, checks_15min: 200, error_budget: budget },
      webhooks: { status: 'operational', error_rate_pct: 0, p95_latency_ms: 100, attempts_15min: 10, error_budget: budget },
      database: { status: 'operational', latency_ms: 3 },
    },
    checked_at: '2026-11-24T12:00:00.000Z',
    window_minutes: 15,
    ...(slo_targets ? { slo_targets } : {}),
  };
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    React.createElement(QueryClientProvider, { client: qc }, React.createElement(SloDashboard)),
  );
}

describe('SloDashboard - meta de SLO', () => {
  beforeEach(() => {
    vi.mocked(supabase.functions.invoke).mockImplementation(async () => invokeResult.current as never);
  });

  it('mostra a meta que veio da edge, nao uma constante da tela', async () => {
    invokeResult.current = {
      data: snapshotCom({ trunk_uptime_pct: 99.5, webhook_error_rate_pct: 2, webhook_p95_latency_ms: 1500, window_minutes: 30 }),
      error: null,
    };
    renderPage();

    await waitFor(() => expect(screen.getByText('Uptime Trunks VoIP')).toBeTruthy());
    const texto = document.body.textContent ?? '';
    expect(texto).toContain('99.5%');
    expect(texto).toContain('< 2%');
    expect(texto).toContain('< 1500ms');
    expect(texto).toContain('janela de 30 min');
    expect(texto).not.toContain('99.9%');
  });

  it('usa a meta padrao apenas quando a edge antiga nao envia slo_targets', async () => {
    invokeResult.current = { data: snapshotCom(), error: null };
    renderPage();

    await waitFor(() => expect(screen.getByText('Uptime Trunks VoIP')).toBeTruthy());
    expect(document.body.textContent ?? '').toContain('99.9%');
  });
});
