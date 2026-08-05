import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { Bell, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { usePageTitle } from '@/hooks/usePageTitle';
import { HoldAlertStatsCards } from '@/components/hold-alerts/HoldAlertStatsCards';
import { HoldAlertsFilters, type HoldAlertsFiltersValue } from '@/components/hold-alerts/HoldAlertsFilters';
import { HoldAlertsTable, type HoldAlertRow } from '@/components/hold-alerts/HoldAlertsTable';

export default function HoldAlerts() {
  usePageTitle('Alertas de Espera');

  const [filters, setFilters] = useState<HoldAlertsFiltersValue>({
    from: subDays(new Date(), 7),
    to: new Date(),
    severity: 'all',
    search: '',
    showRead: true,
  });

  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: ['hold-alerts', filters.from, filters.to, filters.severity],
    queryFn: async () => {
      let query = supabase
        .from('call_alerts')
        .select(`
          *,
          call_session:call_sessions(
            caller_name,
            caller_phone,
            agent_name,
            hold_time_seconds
          )
        `)
        .gte('created_at', startOfDay(filters.from).toISOString())
        .lte('created_at', endOfDay(filters.to).toISOString())
        .in('alert_type', ['hold_warning', 'hold_critical', 'long_hold', 'hold_reminder'])
        .order('created_at', { ascending: false });

      if (filters.severity !== 'all') {
        query = query.eq('severity', filters.severity);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HoldAlertRow[];
    },
  });

  const filteredAlerts = useMemo(() => {
    const q = filters.search.toLowerCase();
    return alerts.filter((alert) => {
      const matchesSearch = q === '' ||
        alert.title.toLowerCase().includes(q) ||
        alert.message.toLowerCase().includes(q) ||
        alert.call_session?.caller_name?.toLowerCase().includes(q) ||
        alert.call_session?.agent_name?.toLowerCase().includes(q);
      const matchesReadStatus = filters.showRead || !alert.is_read;
      return matchesSearch && matchesReadStatus;
    });
  }, [alerts, filters.search, filters.showRead]);

  const stats = useMemo(() => ({
    total: alerts.length,
    unread: alerts.filter((a) => !a.is_read).length,
    critical: alerts.filter((a) => a.severity === 'critical').length,
    warning: alerts.filter((a) => a.severity === 'warning').length,
  }), [alerts]);

  const markAsRead = async (alertId: string) => {
    const { error } = await supabase.from('call_alerts').update({ is_read: true }).eq('id', alertId);
    if (error) {
      toast.error('Erro ao marcar alerta como lido');
    } else {
      refetch();
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = alerts.filter((a) => !a.is_read).map((a) => a.id);
    if (unreadIds.length === 0) return;
    const { error } = await supabase.from('call_alerts').update({ is_read: true }).in('id', unreadIds);
    if (error) {
      toast.error('Erro ao marcar alertas como lidos');
    } else {
      toast.success(`${unreadIds.length} alertas marcados como lidos`);
      refetch();
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-8 w-8 text-primary" />
            Histórico de Alertas de Espera
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitore e gerencie alertas de chamadas em espera
          </p>
        </div>
        {stats.unread > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            <CheckCircle className="h-4 w-4 mr-2" />
            Marcar todos como lidos ({stats.unread})
          </Button>
        )}
      </div>

      <HoldAlertStatsCards stats={stats} />
      <HoldAlertsFilters value={filters} onChange={setFilters} />
      <HoldAlertsTable alerts={filteredAlerts} isLoading={isLoading} onMarkAsRead={markAsRead} />
    </div>
  );
}
