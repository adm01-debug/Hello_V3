import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import SLAPolicies from '../SLAPolicies';

const state = vi.hoisted(() => ({
  enforceMutate: vi.fn(),
  enforcePending: false,
}));

vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: () => {} }));
vi.mock('@/lib/safe-date', () => ({ safeFormatDistanceToNow: () => 'há 2 horas' }));
vi.mock('@/hooks/useSLA', () => ({
  useSlaPolicies: () => ({
    data: [
      {
        id: 'p1', name: 'Alta', description: null, channel: 'whatsapp', priority: 'high',
        first_response_minutes: 15, resolution_minutes: 120, business_hours_only: false,
        is_active: true, applies_to_tags: null, created_at: '', updated_at: '',
      },
    ],
  }),
  useUpsertSlaPolicy: () => ({ mutate: vi.fn(), isPending: false }),
  useSlaCompliance: () => ({
    data: {
      total: 10,
      breached: 2,
      compliancePct: 80,
      byChannel: {
        whatsapp: { total: 6, breached: 2 },
        email: { total: 4, breached: 0 },
      },
      breaches: [
        { id: 'conv-1111-aaaa', sla_breached: true, status: 'open', channel: 'whatsapp', created_at: '2026-11-25T10:00:00Z' },
        { id: 'conv-2222-bbbb', sla_breached: true, status: 'pending', channel: 'whatsapp', created_at: '2026-11-25T11:00:00Z' },
      ],
    },
  }),
  useEnforceSla: () => ({ mutate: state.enforceMutate, isPending: state.enforcePending }),
}));

describe('SLAPolicies — enforcement e violacoes (etapas 151 e 179)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.enforcePending = false;
  });

  it('o botao de verificacao dispara o enforcement', () => {
    render(<SLAPolicies />);
    fireEvent.click(screen.getByRole('button', { name: /Executar verificação/ }));
    expect(state.enforceMutate).toHaveBeenCalledTimes(1);
  });

  it('mostra as violacoes por canal, so os canais com violacao', () => {
    render(<SLAPolicies />);
    const heading = screen.getByText('Violações nos últimos 7 dias');
    const card = heading.closest('div[class*="border-destructive"]') as HTMLElement;
    expect(card).toBeTruthy();
    expect(within(card).getAllByText('whatsapp')).toHaveLength(3);
    expect(within(card).queryByText('email')).not.toBeInTheDocument();
  });

  it('lista as conversas em violacao', () => {
    render(<SLAPolicies />);
    expect(screen.getByText('conv-111')).toBeInTheDocument();
    expect(screen.getByText('conv-222')).toBeInTheDocument();
    expect(screen.getAllByText('há 2 horas')).toHaveLength(2);
  });

  it('bloqueia o botao enquanto a verificacao roda', () => {
    state.enforcePending = true;
    render(<SLAPolicies />);
    const btn = screen.getByRole('button', { name: /Verificando/ });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });
});