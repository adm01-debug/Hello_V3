import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  completeCallback: vi.fn(),
  callback: {
    id: 'cb-1',
    contact_id: null,
    caller_name: "Maria D'Ávila",
    caller_phone: '+5511999990001',
    scheduled_at: new Date(Date.now() + 3600_000).toISOString(),
    notes: null,
    status: 'pending',
    priority: 'normal',
    assigned_agent: null,
    created_by: null,
    completed_at: null,
    created_at: '2026-11-25T10:00:00.000Z',
    updated_at: '2026-11-25T10:00:00.000Z',
  },
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
}));

vi.mock('@/hooks/useScheduledCallbacks', () => ({
  useScheduledCallbacks: () => ({
    callbacks: [mocks.callback],
    isLoading: false,
    fetchCallbacks: vi.fn(),
    completeCallback: mocks.completeCallback,
    cancelCallback: vi.fn(),
    deleteCallback: vi.fn(),
  }),
}));

import { ScheduledCallbacksList } from '../ScheduledCallbacksList';

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="rota">{location.pathname + location.search}</div>;
};

const renderList = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <ScheduledCallbacksList />
      <LocationProbe />
    </MemoryRouter>,
  );

const rotaAtual = () => screen.getByTestId('rota').textContent ?? '';
const params = () => new URLSearchParams(rotaAtual().split('?')[1] ?? '');

describe('ScheduledCallbacksList - Ligar agora', () => {
  beforeEach(() => vi.clearAllMocks());

  it('manda o retorno para o discador com numero, nome e discagem automatica', async () => {
    renderList();
    fireEvent.click(await screen.findByLabelText("Ligar agora para Maria D'Ávila"));

    await waitFor(() => expect(params().get('number')).toBe('+5511999990001'));
    expect(params().get('nome')).toBe("Maria D'Ávila");
    expect(params().get('auto')).toBe('1');
    expect(rotaAtual().startsWith('/?')).toBe(true);
  });
});