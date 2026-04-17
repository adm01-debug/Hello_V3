import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { OmnichannelCard } from '../OmnichannelCard';

vi.mock('@/hooks/useConversations', () => ({
  useConversations: () => ({
    data: [
      { id: '1', status: 'open', channel: 'whatsapp', sla_breached: false },
      { id: '2', status: 'open', channel: 'email', sla_breached: true },
      { id: '3', status: 'pending', channel: 'voice', sla_breached: false },
      { id: '4', status: 'resolved', channel: 'chat', sla_breached: false },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useSLA', () => ({
  useSlaCompliance: () => ({ data: { compliancePct: 92, total: 50, breached: 4 } }),
}));

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('OmnichannelCard', () => {
  it('renderiza KPIs principais (abertas, SLA, violações)', () => {
    render(wrap(<OmnichannelCard />));
    expect(screen.getByText('Omnichannel')).toBeInTheDocument();
    // 3 conversas open/pending
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
  });

  it('exibe badge de SLA quando há violações', () => {
    render(wrap(<OmnichannelCard />));
    expect(screen.getByText(/1 SLA/)).toBeInTheDocument();
  });

  it('lista todos os canais com contagem', () => {
    render(wrap(<OmnichannelCard />));
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('E-mail')).toBeInTheDocument();
    expect(screen.getByText('Voz')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('SMS')).toBeInTheDocument();
  });
});
