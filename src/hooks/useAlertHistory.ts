import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { logger } from '@/lib/logger';

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  severity: string;
  alert_type: string;
  created_at: string;
  is_read: boolean;
  call_session_id: string;
}

export interface AlertStats {
  total: number;
  critical: number;
  warning: number;
  info: number;
  readRate: number;
}

export function useAlertHistory() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [stats, setStats] = useState<AlertStats>({ total: 0, critical: 0, warning: 0, info: 0, readRate: 0 });
  const [alertTypes, setAlertTypes] = useState<string[]>([]);
  const [dailyStats, setDailyStats] = useState<Array<{ date: string; critical: number; warning: number; info: number; total: number }>>([]);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('call_alerts')
        .select('*')
        .gte('created_at', startOfDay(dateRange.from).toISOString())
        .lte('created_at', endOfDay(dateRange.to).toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;

      const alertsData = data || [];
      setAlerts(alertsData);

      const critical = alertsData.filter(a => a.severity === 'critical').length;
      const warning = alertsData.filter(a => a.severity === 'warning').length;
      const info = alertsData.filter(a => a.severity === 'info').length;
      const readCount = alertsData.filter(a => a.is_read).length;
      setStats({
        total: alertsData.length, critical, warning, info,
        readRate: alertsData.length > 0 ? (readCount / alertsData.length) * 100 : 0,
      });

      setAlertTypes([...new Set(alertsData.map(a => a.alert_type))]);

      const dailyMap = new Map<string, { critical: number; warning: number; info: number }>();
      alertsData.forEach(alert => {
        const day = format(new Date(alert.created_at), 'dd/MM');
        const current = dailyMap.get(day) || { critical: 0, warning: 0, info: 0 };
        current[alert.severity as keyof typeof current]++;
        dailyMap.set(day, current);
      });
      setDailyStats(Array.from(dailyMap.entries()).map(([date, counts]) => ({
        date, ...counts, total: counts.critical + counts.warning + counts.info,
      })).reverse());
    } catch (error) {
      logger.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) || alert.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesType = typeFilter === 'all' || alert.alert_type === typeFilter;
    return matchesSearch && matchesSeverity && matchesType;
  });

  return {
    alerts, loading, searchQuery, setSearchQuery, severityFilter, setSeverityFilter,
    typeFilter, setTypeFilter, dateRange, setDateRange, stats, alertTypes, dailyStats,
    filteredAlerts, fetchAlerts,
  };
}
