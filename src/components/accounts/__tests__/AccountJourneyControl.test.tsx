import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { useAccountJourney } from '@/hooks/useAccountJourney';
import { AccountJourneyControl } from '../AccountJourneyControl';

// Radix Select abre por pointerdown e chama APIs que o jsdom nao implementa.
beforeEach(() => {
  Object.defineProperty(Element.prototype, 'hasPointerCapture', { configurable: true, value: () => false });
  Object.defineProperty(Element.prototype, 'setPointerCapture', { configurable: true, value: () => {} });
  Object.defineProperty(Element.prototype, 'releasePointerCapture', { configurable: true, value: () => {} });
  Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: () => {} });
});

const STAGES = [
  { id: 'id-onboarding', stage_key: 'onboarding', stage_name: 'Onboarding', description: null, display_order: 1, color: '#06b6d4', is_active: true },
  { id: 'id-adoption', stage_key: 'adoption', stage_name: 'Adocao', description: null, display_order: 2, color: '#3b82f6', is_active: true },
  { id: 'id-at_risk', stage_key: 'at_risk', stage_name: 'Em Risco', description: null, display_order: 6, color: '#ef4444', is_active: true },
];

type Journey = ReturnType<typeof useAccountJourney>;

const makeJourney = (over: Partial<Journey> = {}) => ({
  stages: STAGES,
  loadingStages: false,
  stagesError: null,
  stageLabel: (key: string | null) =>
    key ? STAGES.find((s) => s.stage_key === key)?.stage_name ?? key : 'Sem etapa',
  historyByAccount: {},
  loadingHistoryFor: null,
  loadHistory: vi.fn(),
  changeStage: vi.fn(async () => true),
  savingFor: null,
  refreshStages: vi.fn(),
  ...over,
} as unknown as Journey);

const ACCOUNT = { id: 'acc-1', name: 'Acme', current_stage: 'adoption', version: 4 };

describe('AccountJourneyControl', () => {
  it('mostra o nome da etapa, nao a chave crua', () => {
    render(<AccountJourneyControl account={ACCOUNT} journey={makeJourney()} />);

    expect(screen.getByText('Adocao')).toBeInTheDocument();
    expect(screen.queryByText('adoption')).toBeNull();
  });

  it('mantem a chave visivel quando a etapa nao esta cadastrada', () => {
    render(<AccountJourneyControl account={{ ...ACCOUNT, current_stage: 'legado' }} journey={makeJourney()} />);

    expect(screen.getByText('legado')).toBeInTheDocument();
  });

  it('confirma a troca com motivo e recarrega a lista', async () => {
    const changeStage = vi.fn(async () => true);
    const onSaved = vi.fn();
    render(<AccountJourneyControl account={ACCOUNT} journey={makeJourney({ changeStage })} onSaved={onSaved} />);

    const trigger = screen.getByRole('combobox', { name: /Mover Acme/ });
    // Enter abre o menu do Radix: o jsdom nao dispara pointerdown de verdade.
    fireEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent.click(await screen.findByRole('option', { name: 'Em Risco' }));

    const confirm = await screen.findByRole('button', { name: 'Confirmar' });
    fireEvent.change(screen.getByLabelText('Motivo da mudanca de etapa'), { target: { value: 'sem uso' } });
    fireEvent.click(confirm);

    await waitFor(() => expect(changeStage).toHaveBeenCalledWith({
      accountId: 'acc-1',
      accountName: 'Acme',
      fromStage: 'adoption',
      toStageKey: 'at_risk',
      version: 4,
      reason: 'sem uso',
    }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'Confirmar' })).toBeNull();
  });

  it('cancelar nao grava a troca', async () => {
    const changeStage = vi.fn(async () => true);
    render(<AccountJourneyControl account={ACCOUNT} journey={makeJourney({ changeStage })} />);

    const trigger = screen.getByRole('combobox', { name: /Mover Acme/ });
    // Enter abre o menu do Radix: o jsdom nao dispara pointerdown de verdade.
    fireEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent.click(await screen.findByRole('option', { name: 'Em Risco' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));

    expect(changeStage).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Confirmar' })).toBeNull();
  });

  it('abre o historico da conta e lista as transicoes', async () => {
    const loadHistory = vi.fn();
    const journey = makeJourney({
      loadHistory,
      historyByAccount: {
        'acc-1': [{
          id: 'h1', account_id: 'acc-1', from_stage: 'onboarding', to_stage: 'adoption',
          reason: 'primeiro valor', triggered_by: 'csm@empresa.com', created_at: '2026-11-20T12:00:00.000Z',
        }],
      },
    });
    render(<AccountJourneyControl account={ACCOUNT} journey={journey} />);

    fireEvent.click(screen.getByTitle('Historico da jornada'));

    expect(loadHistory).toHaveBeenCalledWith('acc-1');
    const region = await screen.findByRole('region', { name: /Historico da jornada de Acme/ });
    expect(region).toHaveTextContent('Onboarding');
    expect(region).toHaveTextContent('primeiro valor');
    expect(region).toHaveTextContent('csm@empresa.com');
  });

  it('explica o historico vazio e o erro de etapas', () => {
    render(<AccountJourneyControl account={ACCOUNT} journey={makeJourney({ stagesError: 'Nao foi possivel carregar as etapas da jornada' })} />);

    fireEvent.click(screen.getByTitle('Historico da jornada'));

    expect(screen.getByText('Nenhuma mudanca de etapa registrada para esta conta.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Nao foi possivel carregar as etapas da jornada');
  });
});