import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface RateLimitLog {
  id: string; user_id: string | null; ip_address: string; endpoint: string;
  request_count: number | null; is_blocked: boolean | null; block_reason: string | null; created_at: string | null;
}

export interface RateLimitAlert {
  id: string; user_id: string | null; ip_address: string; endpoint: string;
  request_count: number; threshold: number; severity: string | null; is_resolved: boolean | null; created_at: string | null;
}

export interface RateLimitSetting {
  id: string; endpoint_pattern: string; max_requests: number | null;
  window_seconds: number | null; block_duration_seconds: number | null; is_enabled: boolean | null;
}

export function useRateLimitData() {
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<RateLimitLog[]>([]);
  const [alerts, setAlerts] = useState<RateLimitAlert[]>([]);
  const [settings, setSettings] = useState<RateLimitSetting[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [logsRes, alertsRes, settingsRes] = await Promise.all([
        supabase.from('rate_limit_logs').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('rate_limit_alerts').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('rate_limit_settings').select('*').order('endpoint_pattern'),
      ]);
      if (logsRes.error) throw logsRes.error;
      if (alertsRes.error) throw alertsRes.error;
      if (settingsRes.error) throw settingsRes.error;
      setLogs(logsRes.data || []); setAlerts(alertsRes.data || []); setSettings(settingsRes.data || []);
    } catch (error) {
      logger.error('Error loading rate limit data:', error);
      toast.error('Erro ao carregar dados');
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    loadData();
    const channel = supabase.channel('rate-limit-alerts').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rate_limit_alerts' }, (payload) => {
      toast.warning('Novo alerta de rate limit!', { description: `IP ${(payload.new as RateLimitAlert).ip_address} excedeu o limite` });
      setAlerts(prev => [payload.new as RateLimitAlert, ...prev]);
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  const refresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); toast.success('Dados atualizados'); };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase.from('rate_limit_alerts').update({ is_resolved: true, resolved_at: new Date().toISOString() }).eq('id', alertId);
      if (error) throw error; toast.success('Alerta resolvido'); await loadData();
    } catch { toast.error('Erro ao resolver alerta'); }
  };

  const unblockIP = async (ipAddress: string) => {
    try {
      const { error } = await supabase.from('rate_limit_logs').update({ is_blocked: false }).eq('ip_address', ipAddress).eq('is_blocked', true);
      if (error) throw error; toast.success(`IP ${ipAddress} desbloqueado`); await loadData();
    } catch { toast.error('Erro ao desbloquear IP'); }
  };

  const cleanOldLogs = async () => {
    try {
      const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const { error } = await supabase.from('rate_limit_logs').delete().lt('created_at', oneWeekAgo.toISOString());
      if (error) throw error; toast.success('Logs antigos removidos'); await loadData();
    } catch { toast.error('Erro ao limpar logs'); }
  };

  const stats = {
    totalRequests: logs.reduce((acc, log) => acc + (log.request_count ?? 0), 0),
    blockedIPs: new Set(logs.filter(l => l.is_blocked).map(l => l.ip_address)).size,
    activeAlerts: alerts.filter(a => !a.is_resolved).length,
    requestsLast24h: logs.filter(l => new Date(l.created_at ?? 0) > new Date(Date.now() - 86400000)).reduce((acc, log) => acc + (log.request_count ?? 0), 0),
  };

  const chartData = logs.slice(0, 24).reverse().map(log => ({
    time: new Date(log.created_at ?? 0).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    requests: log.request_count ?? 0, blocked: log.is_blocked ? 1 : 0,
  }));

  const filteredLogs = logs.filter(log => log.ip_address.includes(searchTerm) || log.endpoint.includes(searchTerm));

  return {
    isLoading, refreshing, logs, alerts, settings, searchTerm, setSearchTerm,
    stats, chartData, filteredLogs,
    refresh, resolveAlert, unblockIP, cleanOldLogs,
  };
}
