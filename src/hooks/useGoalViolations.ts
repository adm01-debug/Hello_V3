import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { logger } from '@/lib/logger';
import { safeFormatDate, safeFormatDatePtBR } from "@/lib/safe-date";
import { safeParseInt } from '@/lib/safe-number';

export interface GoalViolation {
  id: string;
  goal_id: string;
  goal_name: string;
  metric_type: string;
  target_value: number;
  actual_value: number;
  threshold_type: string;
  deviation_percentage: number | null;
  created_at: string;
}

export interface DailyTrend {
  date: string;
  warning: number;
  critical: number;
  total: number;
}

export interface MetricViolations {
  metric: string;
  label: string;
  count: number;
}

export const METRIC_LABELS: Record<string, string> = {
  service_level: 'Nível de Serviço',
  abandonment_rate: 'Taxa de Abandono',
  avg_wait_time: 'Tempo Médio de Espera',
  avg_handle_time: 'Tempo Médio de Atendimento',
};

export function useGoalViolations() {
  const [violations, setViolations] = useState<GoalViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7');
  const [dailyTrends, setDailyTrends] = useState<DailyTrend[]>([]);
  const [metricBreakdown, setMetricBreakdown] = useState<MetricViolations[]>([]);

  const fetchViolations = async () => {
    setLoading(true);
    try {
      const days = safeParseInt(dateRange, { min: 1, max: 365, fallback: 7 });
      const { data, error } = await supabase
        .from('goal_violations').select('*')
        .gte('created_at', startOfDay(subDays(new Date(), days)).toISOString())
        .lte('created_at', endOfDay(new Date()).toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;
      setViolations(data || []);
      processChartData(data || [], days);
    } catch (error) {
      logger.error('Error fetching violations:', error);
      toast.error('Erro ao carregar histórico de violações');
    } finally { setLoading(false); }
  };

  const processChartData = (data: GoalViolation[], days: number) => {
    const dailyMap = new Map<string, { warning: number; critical: number }>();
    for (let i = 0; i <= days; i++) dailyMap.set(format(subDays(new Date(), i), 'yyyy-MM-dd'), { warning: 0, critical: 0 });
    data.forEach(v => {
      const entry = dailyMap.get(safeFormatDate(v.created_at, 'yyyy-MM-dd'));
      if (entry) { if (v.threshold_type === 'warning') entry.warning++; else entry.critical++; }
    });
    setDailyTrends(Array.from(dailyMap.entries()).map(([date, counts]) => ({
      date: safeFormatDatePtBR(date, 'dd/MM'), warning: counts.warning, critical: counts.critical, total: counts.warning + counts.critical,
    })).reverse());

    const metricMap = new Map<string, number>();
    data.forEach(v => metricMap.set(v.metric_type, (metricMap.get(v.metric_type) || 0) + 1));
    setMetricBreakdown(Array.from(metricMap.entries()).map(([metric, count]) => ({ metric, label: METRIC_LABELS[metric] || metric, count })).sort((a, b) => b.count - a.count));
  };

  useEffect(() => {
    fetchViolations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  useEffect(() => {
    const channel = supabase.channel('goal-violations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'goal_violations' }, () => fetchViolations())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const totalViolations = violations.length;
  const criticalCount = violations.filter(v => v.threshold_type === 'critical').length;
  const warningCount = violations.filter(v => v.threshold_type === 'warning').length;

  const formatValue = (value: number, metricType: string) => {
    if (metricType === 'avg_wait_time' || metricType === 'avg_handle_time') {
      return `${Math.floor(value / 60)}m ${Math.round(value % 60)}s`;
    }
    return `${value}%`;
  };

  return {
    violations, loading, dateRange, setDateRange,
    dailyTrends, metricBreakdown,
    totalViolations, criticalCount, warningCount,
    formatValue, fetchViolations,
  };
}
