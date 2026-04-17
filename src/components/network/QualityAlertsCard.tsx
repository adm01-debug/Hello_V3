import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

const log = logger.create('QualityAlertsCard');

type AlertType = 'degrading' | 'poor' | 'offline';

interface VoipAlert {
  id: string;
  alert_type: AlertType;
  mos_at_alert: number | null;
  slope: number | null;
  jitter_ms: number | null;
  rtt_ms: number | null;
  remediation_action: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

const TYPE_STYLES: Record<AlertType, string> = {
  degrading: 'text-warning border-warning/30 bg-warning/10',
  poor: 'text-destructive border-destructive/30 bg-destructive/10',
  offline: 'text-muted-foreground border-border bg-muted/30',
};

export function QualityAlertsCard() {
  const [alerts, setAlerts] = useState<VoipAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | AlertType>('all');

  const load = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('voip_quality_alerts')
        .select('id, alert_type, mos_at_alert, slope, jitter_ms, rtt_ms, remediation_action, acknowledged_at, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      if (filter !== 'all') query = query.eq('alert_type', filter);
      const { data, error } = await query;
      if (error) throw error;
      setAlerts((data || []) as VoipAlert[]);
    } catch (err) {
      log.error('Falha ao carregar alertas', err);
      toast.error('Não foi possível carregar alertas de qualidade');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filter]);

  const unackCount = useMemo(() => alerts.filter(a => !a.acknowledged_at).length, [alerts]);

  const ackAll = async () => {
    const ids = alerts.filter(a => !a.acknowledged_at).map(a => a.id);
    if (!ids.length) return;
    try {
      const { error } = await supabase
        .from('voip_quality_alerts')
        .update({ acknowledged_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
      toast.success(`${ids.length} alerta(s) marcados como lidos`);
      load();
    } catch (err) {
      log.error('Falha ao reconhecer alertas', err);
      toast.error('Falha ao marcar alertas como lidos');
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-start justify-between gap-3 flex-wrap">
        <div>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Alertas de Qualidade
            {unackCount > 0 && (
              <Badge variant="outline" className="text-warning border-warning/40 bg-warning/10 font-mono">
                {unackCount} não lidos
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Eventos de degradação detectados em tempo real</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as 'all' | AlertType)}>
            <SelectTrigger className="w-[150px] h-9">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="degrading">Degradando</SelectItem>
              <SelectItem value="poor">Ruim</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={ackAll} disabled={!unackCount} size="sm" variant="outline">
            <CheckCircle2 className="mr-2 h-4 w-4" /> Marcar lidos
          </Button>
          <Button onClick={load} size="sm" variant="ghost">
            <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhum alerta no período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 px-2">Quando</th>
                  <th className="py-2 px-2">Tipo</th>
                  <th className="py-2 px-2">MOS</th>
                  <th className="py-2 px-2">Slope</th>
                  <th className="py-2 px-2">Jitter</th>
                  <th className="py-2 px-2">RTT</th>
                  <th className="py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id} className={cn('border-b border-border/20 hover:bg-muted/30 transition-colors', !a.acknowledged_at && 'bg-warning/5')}>
                    <td className="py-2 px-2 font-mono text-xs">{new Date(a.created_at).toLocaleString('pt-BR')}</td>
                    <td className="py-2 px-2">
                      <Badge variant="outline" className={cn('font-mono text-[10px] uppercase', TYPE_STYLES[a.alert_type])}>
                        {a.alert_type}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 font-mono">{a.mos_at_alert?.toFixed(2) ?? '—'}</td>
                    <td className="py-2 px-2 font-mono">{a.slope?.toFixed(3) ?? '—'}</td>
                    <td className="py-2 px-2 font-mono">{a.jitter_ms?.toFixed(1) ?? '—'}ms</td>
                    <td className="py-2 px-2 font-mono">{a.rtt_ms?.toFixed(0) ?? '—'}ms</td>
                    <td className="py-2 px-2">
                      {a.acknowledged_at ? (
                        <span className="text-xs text-muted-foreground">Lido</span>
                      ) : (
                        <span className="text-xs text-warning">Pendente</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
