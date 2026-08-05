import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePageVisibility } from '@/hooks/usePageVisibility';

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: unknown;
  created_at: string;
}

export interface SecurityAlertItem {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  source_user_id: string | null;
  source_user_email: string | null;
  trigger_data: Record<string, unknown> | null;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

export interface ActivityStats {
  totalEvents: number;
  viewEvents: number;
  exportEvents: number;
  downloadEvents: number;
  uniqueUsers: number;
  criticalAlerts: number;
}

export function useSecurityMonitoringData(profileEmail: string | undefined) {
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlertItem[]>([]);
  const [stats, setStats] = useState<ActivityStats>({ totalEvents: 0, viewEvents: 0, exportEvents: 0, downloadEvents: 0, uniqueUsers: 0, criticalAlerts: 0 });
  const [isLive, setIsLive] = useState(true);

  const fetchData = useCallback(async () => {
    const { data: logsData } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
    if (logsData) {
      const typedLogs = logsData as unknown as AuditLog[];
      setRecentLogs(typedLogs);
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentData = typedLogs.filter(log => new Date(log.created_at) > last24h);
      setStats({
        totalEvents: recentData.length,
        viewEvents: recentData.filter(l => l.action === 'view').length,
        exportEvents: recentData.filter(l => l.action === 'export').length,
        downloadEvents: recentData.filter(l => l.action === 'download').length,
        uniqueUsers: new Set(recentData.map(l => l.user_id)).size,
        criticalAlerts: 0,
      });
    }
    const { data: alertsData } = await supabase.from('security_alerts').select('*').order('created_at', { ascending: false }).limit(20);
    if (alertsData) {
      setAlerts(alertsData as SecurityAlertItem[]);
      setStats(prev => ({ ...prev, criticalAlerts: (alertsData as SecurityAlertItem[]).filter(a => !a.is_resolved && a.severity === 'critical').length }));
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isVisible = usePageVisibility();

  useEffect(() => {
    if (!isLive || !isVisible) return; // Pausa realtime quando aba oculta — economiza CPU/websocket
    const logsChannel = supabase.channel('audit-logs-realtime').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
      const newLog = payload.new as AuditLog;
      setRecentLogs(prev => [newLog, ...prev.slice(0, 49)]);
      setStats(prev => ({ ...prev, totalEvents: prev.totalEvents + 1, viewEvents: newLog.action === 'view' ? prev.viewEvents + 1 : prev.viewEvents, exportEvents: newLog.action === 'export' ? prev.exportEvents + 1 : prev.exportEvents, downloadEvents: newLog.action === 'download' ? prev.downloadEvents + 1 : prev.downloadEvents }));
      toast.info(`Novo evento: ${newLog.action} em ${newLog.resource_type}`, { description: newLog.user_email || 'Sistema' });
    }).subscribe();

    const alertsChannel = supabase.channel('security-alerts-realtime').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'security_alerts' }, (payload) => {
      const newAlert = payload.new as SecurityAlertItem;
      setAlerts(prev => [newAlert, ...prev.slice(0, 19)]);
      if (newAlert.severity === 'critical') setStats(prev => ({ ...prev, criticalAlerts: prev.criticalAlerts + 1 }));
      toast.error(`Alerta de Segurança: ${newAlert.title}`, { description: newAlert.description, duration: 10000 });
    }).subscribe();

    // Ao voltar a ficar visível, refaz um fetch para preencher gaps ocorridos enquanto oculta
    void fetchData();

    return () => { supabase.removeChannel(logsChannel); supabase.removeChannel(alertsChannel); };
  }, [isLive, isVisible, fetchData]);

  const resolveAlert = async (alertId: string) => {
    const { error } = await supabase.from('security_alerts').update({ is_resolved: true, resolved_at: new Date().toISOString(), resolved_by: profileEmail }).eq('id', alertId);
    if (!error) {
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_resolved: true, resolved_at: new Date().toISOString(), resolved_by: profileEmail || null } : a));
      setStats(prev => ({ ...prev, criticalAlerts: Math.max(0, prev.criticalAlerts - 1) }));
      toast.success('Alerta resolvido');
    }
  };

  return { recentLogs, alerts, stats, isLive, setIsLive, fetchData, resolveAlert };
}
