import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { DashboardGoal } from '@/components/dashboard/DashboardGoalsSettings';
import { logger } from '@/lib/logger';
import { usePageVisibility } from '@/hooks/usePageVisibility';

import { safeFormatDate } from "@/lib/safe-date";
import { mensagemDeErro } from '@/lib/error-message';

// Estados em que a chamada está em curso. Já era o vocabulário usado no índice
// parcial idx_call_sessions_status (20260326203635) e no useBlfBoard.
// 'waiting' nunca existiu em call_sessions — a contagem "em espera" ficava
// permanentemente zerada no dashboard.
const CHAMADA_EM_CURSO = ['active', 'ringing', 'on_hold'] as const;

// E244: o painel consultava o banco a cada 5 s E a cada evento de realtime sem
// agrupamento (3 consultas por leitura). Em pico de call center isso virava
// centenas de consultas por minuto justamente na hora de maior carga. O realtime
// passa a ser a fonte principal, com 1 s de agrupamento por rajada; o poll fica
// so como rede de seguranca para quando o canal cair.
const SAFETY_POLL_MS = 60_000;
const REALTIME_DEBOUNCE_MS = 1_000;

export interface QueueMetrics {
  activeCalls: number;
  waitingCalls: number;
  avgWaitTime: number;
  avgHandleTime: number;
  abandonmentRate: number;
  serviceLevel: number;
  agentsAvailable: number;
  agentsBusy: number;
  agentsOnBreak: number;
}

export interface RealtimeData {
  timestamp: string;
  activeCalls: number;
  waitingCalls: number;
  avgWaitTime: number;
  serviceLevel: number;
}

export interface GoalStatus {
  goal: DashboardGoal;
  currentValue: number;
  status: 'ok' | 'warning' | 'critical';
}

export function useQueueMetrics() {
  const [metrics, setMetrics] = useState<QueueMetrics>({
    activeCalls: 0, waitingCalls: 0, avgWaitTime: 0, avgHandleTime: 0,
    abandonmentRate: 0, serviceLevel: 0, agentsAvailable: 0, agentsBusy: 0, agentsOnBreak: 0,
  });
  const [realtimeData, setRealtimeData] = useState<RealtimeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [goals, setGoals] = useState<DashboardGoal[]>([]);
  const [goalStatuses, setGoalStatuses] = useState<GoalStatus[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [checkingGoals, setCheckingGoals] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const isVisible = usePageVisibility();
  const isVisibleRef = useRef(isVisible);
  const realtimeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchGoals = async () => {
    const { data, error } = await supabase.from('dashboard_goals').select('*').eq('is_active', true);
    if (!error && data) setGoals(data);
  };

  const checkGoalStatus = useCallback((goal: DashboardGoal, currentMetrics: QueueMetrics): GoalStatus => {
    let currentValue = 0;
    switch (goal.metric_type) {
      case 'service_level': currentValue = currentMetrics.serviceLevel; break;
      case 'abandonment_rate': currentValue = currentMetrics.abandonmentRate; break;
      case 'avg_wait_time': currentValue = currentMetrics.avgWaitTime; break;
      case 'avg_handle_time': currentValue = currentMetrics.avgHandleTime; break;
    }
    let status: 'ok' | 'warning' | 'critical' = 'ok';
    if (goal.comparison_operator === 'gte') {
      if (currentValue < goal.critical_threshold) status = 'critical';
      else if (currentValue < goal.warning_threshold) status = 'warning';
    } else {
      if (currentValue > goal.critical_threshold) status = 'critical';
      else if (currentValue > goal.warning_threshold) status = 'warning';
    }
    return { goal, currentValue, status };
  }, []);

  const checkAndNotifyGoals = useCallback((currentMetrics: QueueMetrics) => {
    const statuses = goals.map(goal => checkGoalStatus(goal, currentMetrics));
    setGoalStatuses(statuses);
    statuses.forEach(({ goal, status }) => {
      if (status === 'critical' && goal.notify_on_critical) {
        toast.error(`Meta Crítica: ${goal.name}`, { description: 'A métrica está em nível crítico!', duration: 10000 });
      } else if (status === 'warning' && goal.notify_on_warning) {
        toast.warning(`Meta em Aviso: ${goal.name}`, { description: 'A métrica está abaixo do esperado.', duration: 5000 });
      }
    });
  }, [goals, checkGoalStatus]);

  const fetchMetrics = useCallback(async () => {
    try {
      const { data: activeCalls, error: activeCallsError } = await supabase.from('call_sessions').select('status').in('status', [...CHAMADA_EM_CURSO]);
      const { data: agents, error: agentsError } = await supabase.from('agents').select('status');
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: recentCalls, error: recentCallsError } = await supabase.from('call_sessions').select('duration_seconds, hold_time_seconds, status').gte('created_at', oneHourAgo);

      // Falha de leitura devolve data null. Com o `|| 0` antigo o painel
      // anunciava "0 chamadas, 0 agentes" — indistinguivel de um dia calmo.
      // Se qualquer uma das tres consultas falhar, nao calculamos nada.
      const falhaLeitura = activeCallsError || agentsError || recentCallsError;
      if (falhaLeitura) {
        logger.error('Erro ao ler metricas da fila:', falhaLeitura);
        setError(mensagemDeErro(falhaLeitura));
        return;
      }
      setError(null);

      const active = activeCalls?.filter(c => c.status === 'active' || c.status === 'ringing').length || 0;
      const waiting = activeCalls?.filter(c => c.status === 'on_hold').length || 0;
      const agentsAvailable = agents?.filter(a => a.status === 'available')?.length || 0;
      const agentsBusy = agents?.filter(a => a.status === 'busy' || a.status === 'on_call')?.length || 0;
      const agentsOnBreak = agents?.filter(a => a.status === 'break' || a.status === 'away')?.length || 0;

      const completedCalls = recentCalls?.filter(c => c.status === 'completed') || [];
      const avgHandleTime = completedCalls.length > 0
        ? completedCalls.reduce((acc, c) => acc + (c.duration_seconds || 0), 0) / completedCalls.length : 0;
      const avgWaitTime = completedCalls.length > 0
        ? completedCalls.reduce((acc, c) => acc + (c.hold_time_seconds || 0), 0) / completedCalls.length : 0;

      // Definição única da taxa de abandono, igual à das edges check-goals e
      // check-queue-metrics: abandonada/missed sobre (completadas + abandonadas).
      // Antes o denominador era recentCalls.length, que inclui chamadas ainda em
      // curso — e cada abandonada aparecia duas vezes, porque a coleção já as
      // continha e o código somava de novo.
      const abandonedCalls = recentCalls?.filter(c => c.status === 'abandoned' || c.status === 'missed').length || 0;
      const totalCalls = completedCalls.length + abandonedCalls;
      const abandonmentRate = totalCalls > 0 ? (abandonedCalls / totalCalls) * 100 : 0;
      const answeredQuickly = completedCalls.filter(c => (c.hold_time_seconds || 0) < 20).length;
      const serviceLevel = completedCalls.length > 0 ? (answeredQuickly / completedCalls.length) * 100 : 100;

      const newMetrics = {
        activeCalls: active, waitingCalls: waiting,
        avgWaitTime: Math.round(avgWaitTime), avgHandleTime: Math.round(avgHandleTime),
        abandonmentRate: Math.round(abandonmentRate * 10) / 10,
        serviceLevel: Math.round(serviceLevel), agentsAvailable, agentsBusy, agentsOnBreak,
      };
      setMetrics(newMetrics);
      setLastUpdate(new Date());
      setHasLoaded(true);
      if (goals.length > 0) checkAndNotifyGoals(newMetrics);

      setRealtimeData(prev => {
        const updated = [...prev, {
          timestamp: safeFormatDate(new Date(), 'HH:mm:ss'),
          activeCalls: active, waitingCalls: waiting,
          avgWaitTime: Math.round(avgWaitTime), serviceLevel: Math.round(serviceLevel),
        }];
        return updated.slice(-20);
      });
    } catch (error) {
      logger.error('Error fetching metrics:', error);
      setError(mensagemDeErro(error));
    } finally {
      setLoading(false);
    }
  }, [goals, checkAndNotifyGoals]);

  useEffect(() => { fetchGoals(); }, []);

  // Aba oculta nao precisa de numeros frescos (ninguem esta olhando); ao voltar a
  // ficar visivel, lemos uma vez para nao exibir dado velho.
  useEffect(() => {
    const estavaOculta = !isVisibleRef.current;
    isVisibleRef.current = isVisible;
    if (estavaOculta && isVisible) fetchMetrics();
  }, [isVisible, fetchMetrics]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(() => { if (isVisibleRef.current) fetchMetrics(); }, SAFETY_POLL_MS);
    // Uma rajada de eventos (varias chamadas mudando de status em sequencia)
    // produz uma unica leitura depois de 1 s de silencio.
    const agendarLeitura = () => {
      if (realtimeDebounceRef.current) clearTimeout(realtimeDebounceRef.current);
      realtimeDebounceRef.current = setTimeout(() => {
        realtimeDebounceRef.current = null;
        if (isVisibleRef.current) fetchMetrics();
      }, REALTIME_DEBOUNCE_MS);
    };
    const channel = supabase.channel('queue-metrics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_sessions' }, agendarLeitura)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, agendarLeitura)
      .subscribe();
    return () => {
      clearInterval(interval);
      if (realtimeDebounceRef.current) clearTimeout(realtimeDebounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [fetchMetrics]);

  const runGoalsCheck = async () => {
    setCheckingGoals(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-goals');
      if (error) throw error;
      toast.success(`Verificação concluída: ${data.alertsCreated} alertas criados`);
      fetchMetrics();
      fetchGoals();
    } catch (error) {
      logger.error('Error invoking check-goals:', error);
      toast.error('Erro ao verificar metas');
    } finally {
      setCheckingGoals(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatGoalValue = (value: number, metricType: string) => {
    if (metricType === 'avg_wait_time' || metricType === 'avg_handle_time') return formatTime(value);
    return `${value}%`;
  };

  const criticalGoals = goalStatuses.filter(g => g.status === 'critical');
  const warningGoals = goalStatuses.filter(g => g.status === 'warning');

  return {
    metrics, realtimeData, loading, lastUpdate, goals, goalStatuses,
    error, hasLoaded,
    activeTab, setActiveTab, checkingGoals,
    fetchMetrics, fetchGoals, runGoalsCheck,
    formatTime, formatGoalValue, criticalGoals, warningGoals,
  };
}
