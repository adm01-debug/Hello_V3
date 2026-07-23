import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { DashboardGoal } from '@/components/dashboard/DashboardGoalsSettings';
import { logger } from '@/lib/logger';

import { safeFormatDate } from "@/lib/safe-date";
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
      const { data: activeCalls } = await supabase.from('call_sessions').select('*').eq('status', 'active');
      const { data: agents } = await supabase.from('agents').select('status');
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: recentCalls } = await supabase.from('call_sessions').select('duration_seconds, hold_time_seconds, status').gte('created_at', oneHourAgo);

      const active = activeCalls?.length || 0;
      const waiting = activeCalls?.filter(c => c.status === 'waiting')?.length || 0;
      const agentsAvailable = agents?.filter(a => a.status === 'available')?.length || 0;
      const agentsBusy = agents?.filter(a => a.status === 'busy' || a.status === 'on_call')?.length || 0;
      const agentsOnBreak = agents?.filter(a => a.status === 'break' || a.status === 'away')?.length || 0;

      const completedCalls = recentCalls?.filter(c => c.status === 'completed') || [];
      const avgHandleTime = completedCalls.length > 0
        ? completedCalls.reduce((acc, c) => acc + (c.duration_seconds || 0), 0) / completedCalls.length : 0;
      const avgWaitTime = completedCalls.length > 0
        ? completedCalls.reduce((acc, c) => acc + (c.hold_time_seconds || 0), 0) / completedCalls.length : 0;

      const abandonedCalls = recentCalls?.filter(c => c.status === 'abandoned')?.length || 0;
      const totalCalls = (recentCalls?.length || 0) + abandonedCalls;
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
    } finally {
      setLoading(false);
    }
  }, [goals, checkAndNotifyGoals]);

  useEffect(() => { fetchGoals(); }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    const channel = supabase.channel('queue-metrics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_sessions' }, () => fetchMetrics())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, () => fetchMetrics())
      .subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(channel); };
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
    activeTab, setActiveTab, checkingGoals,
    fetchMetrics, fetchGoals, runGoalsCheck,
    formatTime, formatGoalValue, criticalGoals, warningGoals,
  };
}
