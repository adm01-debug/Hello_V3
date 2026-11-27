import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

type Res = { data?: unknown; error: unknown };

const state: {
  stages: Res;
  history: Res;
  update: Res;
  insert: Res;
  user: { email?: string } | null;
} = {
  stages: { data: [], error: null },
  history: { data: [], error: null },
  update: { error: null },
  insert: { error: null },
  user: { email: 'csm@empresa.com' },
};

const stagesChain = () => {
  const c: Record<string, unknown> = {};
  c.select = vi.fn(() => c);
  c.eq = vi.fn(() => c);
  c.order = vi.fn(() => c);
  (c as { then: (r: (v: Res) => void) => void }).then = (r) => r(state.stages);
  return c;
};

const historyChain = () => {
  const c: Record<string, unknown> = {};
  c.select = vi.fn(() => c);
  c.eq = vi.fn(() => c);
  c.order = vi.fn(() => c);
  c.limit = vi.fn(() => c);
  (c as { then: (r: (v: Res) => void) => void }).then = (r) => r(state.history);
  return c;
};

const updateEq = vi.fn(() => Promise.resolve(state.update));
const updateMock = vi.fn((_payload: unknown) => ({ eq: updateEq }));
const insertMock = vi.fn((_payload: unknown) => Promise.resolve(state.insert));

const fromMock = vi.fn((table: string) => {
  if (table === 'customer_journey_stages') return { select: vi.fn(() => stagesChain()) };
  if (table === 'account_journey_history') {
    return { select: vi.fn(() => historyChain()), insert: insertMock };
  }
  return { update: updateMock };
});

const getUserMock = vi.fn(() => Promise.resolve({ data: { user: state.user } }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => fromMock(table),
    auth: { getUser: () => getUserMock() },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

import { toast } from 'sonner';
import { useAccountJourney } from '../useAccountJourney';

type Fn = ReturnType<typeof vi.fn>;
const toastMock = toast as unknown as { success: Fn; error: Fn; warning: Fn };

const stage = (key: string, name: string, order: number) => ({
  id: `id-${key}`,
  stage_key: key,
  stage_name: name,
  description: null,
  display_order: order,
  color: '#3b82f6',
  is_active: true,
});

const STAGES = [
  stage('onboarding', 'Onboarding', 1),
  stage('adoption', 'Adoção', 2),
  stage('at_risk', 'Em Risco', 6),
];

beforeEach(() => {
  vi.clearAllMocks();
  state.stages = { data: STAGES, error: null };
  state.history = { data: [], error: null };
  state.update = { error: null };
  state.insert = { error: null };
  state.user = { email: 'csm@empresa.com' };
});

describe('useAccountJourney', () => {
  it('carrega as etapas ativas e traduz a chave para o nome', async () => {
    const { result } = renderHook(() => useAccountJourney());
    await waitFor(() => expect(result.current.loadingStages).toBe(false));

    expect(result.current.stages.map((s) => s.stage_key)).toEqual(['onboarding', 'adoption', 'at_risk']);
    expect(result.current.stageLabel('at_risk')).toBe('Em Risco');
    expect(result.current.stageLabel(null)).toBe('Sem etapa');
  });

  it('mantem a chave visivel quando a etapa nao esta cadastrada', async () => {
    const { result } = renderHook(() => useAccountJourney());
    await waitFor(() => expect(result.current.loadingStages).toBe(false));

    expect(result.current.stageLabel('desconhecida')).toBe('desconhecida');
  });

  it('expoe erro na tela quando a leitura das etapas falha', async () => {
    state.stages = { data: null, error: new Error('denied') };
    const { result } = renderHook(() => useAccountJourney());
    await waitFor(() => expect(result.current.loadingStages).toBe(false));

    expect(result.current.stagesError).toBeTruthy();
    expect(result.current.stages).toEqual([]);
  });

  it('grava a etapa nova com lock otimista e registra a transicao', async () => {
    state.history = {
      data: [{
        id: 'h1', account_id: 'acc-1', from_stage: 'adoption', to_stage: 'at_risk',
        reason: 'sem uso', triggered_by: 'csm@empresa.com', created_at: '2026-11-26T12:00:00.000Z',
      }],
      error: null,
    };
    const { result } = renderHook(() => useAccountJourney());
    await waitFor(() => expect(result.current.loadingStages).toBe(false));

    let ok = false;
    await act(async () => {
      ok = await result.current.changeStage({
        accountId: 'acc-1',
        accountName: 'Acme',
        fromStage: 'adoption',
        toStageKey: 'at_risk',
        version: 4,
        reason: '  sem uso  ',
      });
    });

    expect(ok).toBe(true);
    expect(updateMock).toHaveBeenCalledWith({ current_stage: 'at_risk', version: 4 });
    expect(updateEq).toHaveBeenCalledWith('id', 'acc-1');
    expect(insertMock).toHaveBeenCalledWith({
      account_id: 'acc-1',
      from_stage: 'adoption',
      to_stage: 'at_risk',
      reason: 'sem uso',
      triggered_by: 'csm@empresa.com',
    });
    expect(toastMock.success).toHaveBeenCalled();
    expect(result.current.historyByAccount['acc-1']).toHaveLength(1);
  });

  it('nao faz nada quando a etapa escolhida e a atual', async () => {
    const { result } = renderHook(() => useAccountJourney());
    await waitFor(() => expect(result.current.loadingStages).toBe(false));

    let ok = true;
    await act(async () => {
      ok = await result.current.changeStage({
        accountId: 'acc-1', accountName: 'Acme', fromStage: 'at_risk', toStageKey: 'at_risk',
      });
    });

    expect(ok).toBe(false);
    expect(updateMock).not.toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('avisa que a etapa mudou sem historico quando a insercao falha', async () => {
    state.insert = { error: new Error('rls') };
    const { result } = renderHook(() => useAccountJourney());
    await waitFor(() => expect(result.current.loadingStages).toBe(false));

    await act(async () => {
      await result.current.changeStage({
        accountId: 'acc-1', accountName: 'Acme', fromStage: 'adoption', toStageKey: 'at_risk',
      });
    });

    expect(updateMock).toHaveBeenCalled();
    expect(toastMock.warning).toHaveBeenCalledWith('Etapa alterada, mas o historico nao foi registrado');
  });

  it('explica o conflito de lock otimista e nao grava historico', async () => {
    state.update = { error: { message: 'OPTIMISTIC_LOCK_CONFLICT' } };
    const { result } = renderHook(() => useAccountJourney());
    await waitFor(() => expect(result.current.loadingStages).toBe(false));

    let ok = true;
    await act(async () => {
      ok = await result.current.changeStage({
        accountId: 'acc-1', accountName: 'Acme', fromStage: 'adoption', toStageKey: 'at_risk', version: 1,
      });
    });

    expect(ok).toBe(false);
    expect(insertMock).not.toHaveBeenCalled();
    expect(toastMock.error).toHaveBeenCalledWith(expect.stringContaining('outro usuario'));
  });

  it('usa o erro generico quando a gravacao falha por outro motivo', async () => {
    state.update = { error: { message: 'permission denied' } };
    const { result } = renderHook(() => useAccountJourney());
    await waitFor(() => expect(result.current.loadingStages).toBe(false));

    await act(async () => {
      await result.current.changeStage({
        accountId: 'acc-1', accountName: 'Acme', fromStage: 'adoption', toStageKey: 'at_risk',
      });
    });

    expect(toastMock.error).toHaveBeenCalledWith('Falha ao alterar a etapa da conta');
  });

  it('registra system quando nao ha sessao e avisa quando o historico nao carrega', async () => {
    state.user = null;
    const { result } = renderHook(() => useAccountJourney());
    await waitFor(() => expect(result.current.loadingStages).toBe(false));

    state.history = { data: null, error: new Error('denied') };
    await act(async () => {
      await result.current.loadHistory('acc-9');
    });

    expect(insertMock).not.toHaveBeenCalled();
    expect(toastMock.error).toHaveBeenCalledWith('Falha ao carregar o historico da jornada');

    state.history = { data: [], error: null };
    await act(async () => {
      await result.current.changeStage({
        accountId: 'acc-1', accountName: 'Acme', fromStage: 'adoption', toStageKey: 'at_risk',
      });
    });

    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ triggered_by: 'system' }));
  });
});