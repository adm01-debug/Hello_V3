import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, AlertCircle, Info, Clock, Calendar, Filter, CheckCircle, X, Bell, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { usePageTitle } from '@/hooks/usePageTitle';

interface HoldAlert {
  id: string; title: string; message: string; severity: 'info' | 'warning' | 'critical';
  alert_type: string; is_read: boolean; created_at: string; call_session_id: string;
  call_session?: { caller_name: string | null; caller_phone: string | null; agent_name: string | null; hold_time_seconds: number | null; };
}

const severityConfig = {
  info: { label: 'Informativo', icon: Info, color: 'bg-info/10 text-info border-info/20', badgeVariant: 'secondary' as const },
  warning: { label: 'Aviso', icon: AlertTriangle, color: 'bg-warning/10 text-warning border-warning/20', badgeVariant: 'outline' as const },
  critical: { label: 'Crítico', icon: AlertCircle, color: 'bg-destructive/10 text-destructive border-destructive/20', badgeVariant: 'destructive' as const },
};

const formatDuration = (seconds: number | null): string => {
  if (!seconds) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
};

export default function HoldAlerts() {
  usePageTitle('Alertas de Espera');

  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({ from: subDays(new Date(), 7), to: new Date() });
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRead, setShowRead] = useState(true);

  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: ['hold-alerts', dateRange, severityFilter],
    queryFn: async () => {
      let query = supabase.from('call_alerts').select(`*, call_session:call_sessions(caller_name, caller_phone, agent_name, hold_time_seconds)`)
        .gte('created_at', startOfDay(dateRange.from).toISOString()).lte('created_at', endOfDay(dateRange.to).toISOString())
        .in('alert_type', ['hold_warning', 'hold_critical', 'long_hold', 'hold_reminder']).order('created_at', { ascending: false });
      if (severityFilter !== 'all') query = query.eq('severity', severityFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data as HoldAlert[];
    },
  });

  const filteredAlerts = useMemo(() => alerts.filter(alert => {
    const matchesSearch = searchQuery === '' || alert.title.toLowerCase().includes(searchQuery.toLowerCase()) || alert.message.toLowerCase().includes(searchQuery.toLowerCase()) || alert.call_session?.caller_name?.toLowerCase().includes(searchQuery.toLowerCase()) || alert.call_session?.agent_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && (showRead || !alert.is_read);
  }), [alerts, searchQuery, showRead]);

  const stats = useMemo(() => ({ total: alerts.length, unread: alerts.filter(a => !a.is_read).length, critical: alerts.filter(a => a.severity === 'critical').length, warning: alerts.filter(a => a.severity === 'warning').length }), [alerts]);

  const markAsRead = async (alertId: string) => { const { error } = await supabase.from('call_alerts').update({ is_read: true }).eq('id', alertId); if (error) toast.error('Erro ao marcar alerta como lido'); else refetch(); };
  const markAllAsRead = async () => { const unreadIds = alerts.filter(a => !a.is_read).map(a => a.id); if (unreadIds.length === 0) return; const { error } = await supabase.from('call_alerts').update({ is_read: true }).in('id', unreadIds); if (error) toast.error('Erro ao marcar alertas como lidos'); else { toast.success(`${unreadIds.length} alertas marcados como lidos`); refetch(); } };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-foreground flex items-center gap-2"><Bell className="h-8 w-8 text-primary" />Histórico de Alertas de Espera</h1><p className="text-muted-foreground mt-1">Monitore e gerencie alertas de chamadas em espera</p></div>
        {stats.unread > 0 && <Button onClick={markAllAsRead} variant="outline"><CheckCircle className="h-4 w-4 mr-2" />Marcar todos como lidos ({stats.unread})</Button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total de Alertas</p><p className="text-2xl font-bold">{stats.total}</p></div><Bell className="h-8 w-8 text-muted-foreground/50" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Não Lidos</p><p className="text-2xl font-bold text-primary">{stats.unread}</p></div><Info className="h-8 w-8 text-primary/50" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Críticos</p><p className="text-2xl font-bold text-destructive">{stats.critical}</p></div><AlertCircle className="h-8 w-8 text-destructive/50" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Avisos</p><p className="text-2xl font-bold text-warning">{stats.warning}</p></div><AlertTriangle className="h-8 w-8 text-warning/50" /></div></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" />Filtros</CardTitle></CardHeader><CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2"><Label>Data Início</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left"><Calendar className="mr-2 h-4 w-4" />{format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={dateRange.from} onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))} initialFocus /></PopoverContent></Popover></div>
          <div className="space-y-2"><Label>Data Fim</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left"><Calendar className="mr-2 h-4 w-4" />{format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={dateRange.to} onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))} initialFocus /></PopoverContent></Popover></div>
          <div className="space-y-2"><Label>Gravidade</Label><Select value={severityFilter} onValueChange={setSeverityFilter}><SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger><SelectContent><SelectItem value="all">Todas</SelectItem><SelectItem value="info">Informativo</SelectItem><SelectItem value="warning">Aviso</SelectItem><SelectItem value="critical">Crítico</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>Buscar</Label><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por título, agente..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div></div>
        </div>
        <div className="flex items-center gap-4 mt-4"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={showRead} onChange={(e) => setShowRead(e.target.checked)} className="rounded border-input" /><span className="text-sm text-muted-foreground">Mostrar alertas lidos</span></label></div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Alertas ({filteredAlerts.length})</CardTitle><CardDescription>Lista de alertas de chamadas em espera no período selecionado</CardDescription></CardHeader><CardContent>
        {isLoading ? <div className="text-center py-8 text-muted-foreground">Carregando alertas...</div> : filteredAlerts.length === 0 ? <div className="text-center py-8 text-muted-foreground"><Bell className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Nenhum alerta encontrado para os filtros selecionados</p></div> : (
          <Table><TableHeader><TableRow><TableHead className="w-12">Status</TableHead><TableHead>Gravidade</TableHead><TableHead>Título</TableHead><TableHead>Chamador</TableHead><TableHead>Agente</TableHead><TableHead>Tempo em Espera</TableHead><TableHead>Data/Hora</TableHead><TableHead className="w-12">Ações</TableHead></TableRow></TableHeader><TableBody>
            {filteredAlerts.map((alert) => { const config = severityConfig[alert.severity] || severityConfig.info; const Icon = config.icon; return (
              <TableRow key={alert.id} className={!alert.is_read ? 'bg-primary/5' : ''}>
                <TableCell>{!alert.is_read ? <div className="h-2 w-2 rounded-full bg-primary" /> : <CheckCircle className="h-4 w-4 text-muted-foreground" />}</TableCell>
                <TableCell><Badge variant={config.badgeVariant} className={`${config.color} flex items-center gap-1 w-fit`}><Icon className="h-3 w-3" />{config.label}</Badge></TableCell>
                <TableCell><div><p className="font-medium">{alert.title}</p><p className="text-sm text-muted-foreground truncate max-w-xs">{alert.message}</p></div></TableCell>
                <TableCell>{alert.call_session?.caller_name || alert.call_session?.caller_phone || '-'}</TableCell>
                <TableCell>{alert.call_session?.agent_name || '-'}</TableCell>
                <TableCell><div className="flex items-center gap-1"><Clock className="h-3 w-3 text-muted-foreground" />{formatDuration(alert.call_session?.hold_time_seconds ?? null)}</div></TableCell>
                <TableCell><div className="text-sm"><p>{format(new Date(alert.created_at), 'dd/MM/yyyy', { locale: ptBR })}</p><p className="text-muted-foreground">{format(new Date(alert.created_at), 'HH:mm:ss', { locale: ptBR })}</p></div></TableCell>
                <TableCell>{!alert.is_read && <Button size="icon" variant="ghost" onClick={() => markAsRead(alert.id)} title="Marcar como lido"><X className="h-4 w-4" /></Button>}</TableCell>
              </TableRow>); })}
          </TableBody></Table>
        )}
      </CardContent></Card>
    </div>
  );
}
