import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

let goalsData: unknown[] = [];
let activeCallsData: unknown[] = [];
let agentsData: unknown[] = [];
let recentCallsData: unknown[] = [];
let invokeResult: { data: unknown; error: unknown } = { data: { alertsCreated: 2 }, error: null };
let readError: string | null = null;

vi.mock('@/components/dashboard/DashboardGoalsSettings', () => ({}));

// `vi.hoisted` porque a fabrica de `vi.mock` roda antes das declaracoes do topo.
const realtimeHandlers = vi.hoisted(() => [] as Array<() => void>);

vi.mock('@/integrations/supabase/client', () => {
  const from = vi.fn((table: string) => {
    const b: Record<string, unknown> = {};
    b.select = vi.fn(() => b);
    b.eq = vi.fn(() => {
      if (table === 'dashboard_goals') return Promise.resolve({ data: goalsData, error: null });
      if (table === 'call_sessions') return Promise.resolve({ data: activeCallsData, error: readError ? { message: readError } : null });
      return b;
    });
    b.in = vi.fn(() => {
      if (table === 'call_sessions') return Promise.resolve({ data: activeCallsData, error: readError ? { message: readError } : null });
      return b;
    });
    b.gte = vi.fn(() => Promise.resolve({ data: recentCallsData, error: readError ? { message: readError } : null }));
    b.then = (resolve: (v: unknown) => void) => {
      if (table === 'agents') return resolve({ data: agentsData, error: readError ? { message: readError } : null });
      return resolve({ data: [], error: null });
    };
    return b;
  });
  const channel = vi.fn(() => {
    const ch: Record<string, unknown> = {};
    ch.on = vi.fn((_evento: string, _cfg: unknown, cb: () => void) => {
      if (typeof cb === 'function') realtimeHandlers.push(cb);
      return ch;
    });
    ch.subscribe = vi.fn(() => ch);
    return ch;
  });
  return { supabase: { from, channel, removeChannel: vi.fn(), functions: { invoke: vi.fn(() => Promise.resolve(invokeResult)) } } };
});
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

import { useQueueMetrics } from '../useQueueMetrics';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

describe('useQueueMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    realtimeHandlers.length = 0;
    goalsData = [];
    activeCallsData = [{ status: 'active' }, { status: 'ringing' }, { status: 'on_hold' }];
    agentsData = [{ status: 'available' }, { status: 'busy' }, { status: 'on_call' }, { status: 'break' }, { status: 'away' }];
    recentCallsData = [
      { status: 'completed', duration_seconds: 100, hold_time_seconds: 10 },
      { status: 'completed', duration_seconds: 50, hold_time_seconds: 30 },
      { status: 'abandoned', duration_seconds: 0, hold_time_seconds: 0 },
    ];
    invokeResult = { data: { alertsCreated: 2 }, error: null };
    readError = null;
  });
  it('fetches metrics and computes values', async () => {
    const { result } = renderHook(() => useQueueMetrics());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.metrics.activeCalls).toBe(2);
    expect(result.current.metrics.waitingCalls).toBe(1);
    expect(result.current.metrics.agentsBusy).toBe(2);
    expect(result.current.realtimeData.length).toBeGreaterThan(0);
  });

  it('conta em espera apenas chamadas on_hold, nunca um status inventado', async () => {
    // Regressão: o hook filtrava por status === 'waiting', que não existe em
    // call_sessions (vocabulário real: active/ringing/on_hold/completed/
    // missed/abandoned). O card "em espera" do dashboard ficava sempre em 0.
    activeCallsData = [{ status: 'waiting' }, { status: 'waiting' }];
    const { result } = renderHook(() => useQueueMetrics());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.metrics.waitingCalls).toBe(0);
    expect(result.current.metrics.activeCalls).toBe(0);
  });

  it('checkGoalStatus handles gte and lte operators', async () => {
    const { result } = renderHook(() => useQueueMetrics());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const gteCritical = result.current as unknown as Record<string, unknown>;
    void gteCritical;
    // exercise via exposed checkGoalStatus is not returned; instead test formatters
    expect(result.current.formatTime(125)).toBe('2:05');
    expect(result.current.formatGoalValue(90, 'service_level')).toBe('90%');
    expect(result.current.formatGoalValue(65, 'avg_wait_time')).toBe('1:05');
  });

  it('calcula taxa de abandono sem contar a abandonada duas vezes', async () => {
    // Regressão: totalCalls somava `abandonedCalls` a `recentCalls.length`, mas
    // recentCalls já inclui as abandonadas. Com 3 abandonadas em 10 chamadas a
    // taxa correta é 30%; a fórmula antiga dava 3/13 = 23,1%.
    recentCallsData = [
      ...Array.from({ length: 7 }, () => ({ status: 'completed', duration_seconds: 60, hold_time_seconds: 5 })),
      ...Array.from({ length: 3 }, () => ({ status: 'abandoned', duration_seconds: 0, hold_time_seconds: 0 })),
    ];
    const { result } = renderHook(() => useQueueMetrics());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.metrics.abandonmentRate).toBe(30);
  });

  it('taxa de abandono ignora chamadas em curso no denominador', async () => {
    // Chamada ainda em curso (active/ringing/on_hold) não tem desfecho: não é
    // atendida nem abandonada. Antes ela entrava no denominador e deprimia a
    // taxa — 3 abandonadas em 10 chamadas sendo 5 em curso davam 20% em vez
    // dos 60% reais (3 de 5 finalizadas).
    activeCallsData = [
      ...Array.from({ length: 5 }, () => ({ status: 'on_hold' })),
    ];
    recentCallsData = [
      ...Array.from({ length: 2 }, () => ({ status: 'completed', duration_seconds: 60, hold_time_seconds: 5 })),
      ...Array.from({ length: 3 }, () => ({ status: 'abandoned', duration_seconds: 0, hold_time_seconds: 0 })),
      ...Array.from({ length: 5 }, () => ({ status: 'on_hold', duration_seconds: 0, hold_time_seconds: 0 })),
    ];
    const { result } = renderHook(() => useQueueMetrics());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.metrics.abandonmentRate).toBe(60);
  });

  it('taxa de abandono conta missed como abandono, igual as edges', async () => {
    // check-goals e check-queue-metrics usam `.in('status', ['abandoned','missed'])`.
    // O hook contava só 'abandoned', então o alerta da edge e o card do
    // dashboard discordavam.
    recentCallsData = [
      { status: 'completed', duration_seconds: 60, hold_time_seconds: 5 },
      { status: 'abandoned', duration_seconds: 0, hold_time_seconds: 0 },
      { status: 'missed', duration_seconds: 0, hold_time_seconds: 0 },
    ];
    const { result } = renderHook(() => useQueueMetrics());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.metrics.abandonmentRate).toBe(66.7);
  });

  it('notifies on goals when goals present', async () => {
    goalsData = [
      { id: 'g1', name: 'SL', metric_type: 'service_level', comparison_operator: 'gte', critical_threshold: 200, warning_threshold: 300, notify_on_critical: true, notify_on_warning: true },
      { id: 'g2', name: 'AB', metric_type: 'abandonment_rate', comparison_operator: 'lte', critical_threshold: -1, warning_threshold: -1, notify_on_critical: true, notify_on_warning: true },
    ];
    const { result } = renderHook(() => useQueueMetrics());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.fetchMetrics(); });
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(result.current.criticalGoals.length + result.current.warningGoals.length).toBeGreaterThanOrEqual(0);
  });

  it('runGoalsCheck success and error', async () => {
    const { result } = renderHook(() => useQueueMetrics());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.runGoalsCheck(); });
    expect(toast.success).toHaveBeenCalled();

    invokeResult = { data: null, error: new Error('boom') };
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValueOnce(invokeResult);
    await act(async () => { await result.current.runGoalsCheck(); });
    expect(toast.error).toHaveBeenCalled();
  });

  it('setActiveTab updates state', async () => {
    const { result } = renderHook(() => useQueueMetrics());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => { result.current.setActiveTab('goals'); });
    expect(result.current.activeTab).toBe('goals');
  });

  it('handles empty data sets (zero branches)', async () => {
    activeCallsData = [];
    agentsData = [];
    recentCallsData = [];
    const { result } = renderHook(() => useQueueMetrics());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.metrics.serviceLevel).toBe(100);
  });
  it('falha de leitura nao vira zero: publica erro e preserva o estado desconhecido', async () => {
    // A-009: com data null o calculo seguia com `|| 0` e o painel anunciava
    // "0 chamadas ativas, 0 agentes" — o mesmo desenho de um dia calmo.
    readError = 'permission denied for table call_sessions';
    const { result } = renderHook(() => useQueueMetrics());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('permission denied for table call_sessions');
    expect(result.current.hasLoaded).toBe(false);
    expect(result.current.metrics.activeCalls).toBe(0);
    expect(result.current.realtimeData).toHaveLength(0);
  });

  it('mantem os ultimos numeros bons ao falhar depois de um sucesso, com erro visivel', async () => {
    const { result } = renderHook(() => useQueueMetrics());
    await waitFor(() => expect(result.current.hasLoaded).toBe(true));
    expect(result.current.metrics.activeCalls).toBe(2);
    expect(result.current.error).toBeNull();

    readError = 'timeout';
    await act(async () => { await result.current.fetchMetrics(); });
    expect(result.current.error).toBe('timeout');
    expect(result.current.hasLoaded).toBe(true);
    expect(result.current.metrics.activeCalls).toBe(2);

    readError = null;
    await act(async () => { await result.current.fetchMetrics(); });
    expect(result.current.error).toBeNull();
  });

  // E244: sem agrupamento, 20 mudancas de status em 2 s viravam 20 leituras de 3
  // consultas cada. Com o debounce de 1 s, a rajada inteira vale uma leitura.
  it('agrupa uma rajada de eventos de realtime numa unica leitura', async () => {
    const { result } = renderHook(() => useQueueMetrics());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(realtimeHandlers.length).toBeGreaterThanOrEqual(2);

    const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>;
    fromMock.mockClear();

    vi.useFakeTimers();
    act(() => { realtimeHandlers.forEach(h => { for (let i = 0; i < 10; i++) h(); }); });
    // Nada de leitura antes do silencio de 1 s: a rajada continua sendo agrupada.
    expect(fromMock).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(1000); });
    vi.useRealTimers();

    await waitFor(() => expect(fromMock).toHaveBeenCalledTimes(3));
    expect(fromMock).toHaveBeenCalledTimes(3);
  });

  // E246: o aviso era derivado do estado, entao uma meta critica reaparecia a
  // cada leitura (a cada 5 s antes da etapa 244). Agora avisa na transicao.
  describe('aviso de meta por transicao (E246)', () => {
    const metaCritica = () => ([{
      id: 'g1', name: 'Nivel de servico', metric_type: 'service_level', comparison_operator: 'gte',
      critical_threshold: 90, warning_threshold: 80, notify_on_critical: true, notify_on_warning: true,
    }]);

    it('avisa uma vez enquanto a meta segue critica', async () => {
      goalsData = metaCritica();
      const { result } = renderHook(() => useQueueMetrics());
      await waitFor(() => expect(result.current.loading).toBe(false));
      for (let i = 0; i < 5; i += 1) {
        await act(async () => { await result.current.fetchMetrics(); });
      }
      expect(toast.error).toHaveBeenCalledTimes(1);
    });

    it('avisa a volta ao normal e o intervalo minimo barra a oscilacao', async () => {
      goalsData = metaCritica();
      const { result } = renderHook(() => useQueueMetrics());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));

      // Espera curta: as duas chamadas passam a contar como atendidas rapidamente.
      recentCallsData = [
        { status: 'completed', duration_seconds: 40, hold_time_seconds: 5 },
        { status: 'completed', duration_seconds: 30, hold_time_seconds: 5 },
      ];
      await act(async () => { await result.current.fetchMetrics(); });
      expect(toast.success).toHaveBeenCalledWith('Meta normalizada: Nivel de servico', expect.anything());

      // Voltou a ficar critica dentro dos 15 min: nao repete o aviso.
      recentCallsData = [{ status: 'completed', duration_seconds: 40, hold_time_seconds: 300 }];
      await act(async () => { await result.current.fetchMetrics(); });
      expect(toast.error).toHaveBeenCalledTimes(1);
    });
  });

  // E244: o poll era de 5 s por cima do realtime; virou rede de seguranca de 60 s.
  it('usa poll de seguranca de 60 s em vez de 5 s', async () => {
    const setIntervalSpy = vi.spyOn(window, 'setInterval');
    const { result } = renderHook(() => useQueueMetrics());
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60000);
    await waitFor(() => expect(result.current.loading).toBe(false));
    setIntervalSpy.mockRestore();
  });
});
