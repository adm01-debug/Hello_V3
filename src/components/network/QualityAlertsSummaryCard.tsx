import { useState } from 'react';
import { BarChart3, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVoipQualityAlertsSummary, type AlertsSummaryPeriod } from '@/hooks/useVoipQualityAlertsSummary';

const PERIOD_LABEL: Record<AlertsSummaryPeriod, string> = {
  day: 'Hoje',
  week: '7 dias',
  month: '30 dias',
};

const TYPE_LABEL: Record<string, string> = {
  degrading: 'Degradando',
  poor: 'Ruim',
  offline: 'Offline',
};

/**
 * Resumo agregado de voip_quality_alerts (voip-quality-alerts-summary): complementa o
 * QualityAlertsCard — que lista as últimas 20 ocorrências — com contagem por tipo, MOS
 * médio e os usuários mais afetados no período.
 */
export function QualityAlertsSummaryCard() {
  const [period, setPeriod] = useState<AlertsSummaryPeriod>('week');
  const { data, isLoading, error } = useVoipQualityAlertsSummary(period);

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-start justify-between gap-3 flex-wrap">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Resumo de Alertas de Qualidade
          </CardTitle>
          <CardDescription>Agregado por período — complementa a lista de alertas abaixo</CardDescription>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as AlertsSummaryPeriod)}>
          <SelectTrigger className="w-[120px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Hoje</SelectItem>
            <SelectItem value="week">7 dias</SelectItem>
            <SelectItem value="month">30 dias</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive flex items-center gap-2 py-4">
            <AlertCircle className="h-4 w-4" /> Não foi possível carregar o resumo.
          </p>
        ) : !data ? null : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border border-border/40 p-3">
                <p className="text-xs text-muted-foreground">Total ({PERIOD_LABEL[period]})</p>
                <p className="text-2xl font-mono">{data.total}</p>
              </div>
              <div className="rounded-lg border border-border/40 p-3">
                <p className="text-xs text-muted-foreground">Não lidos</p>
                <p className={`text-2xl font-mono ${data.unacknowledged > 0 ? 'text-warning' : ''}`}>
                  {data.unacknowledged}
                </p>
              </div>
              <div className="rounded-lg border border-border/40 p-3">
                <p className="text-xs text-muted-foreground">MOS médio no alerta</p>
                <p className="text-2xl font-mono">{data.mos_avg_at_alert?.toFixed(2) ?? '—'}</p>
              </div>
              <div className="rounded-lg border border-border/40 p-3">
                <p className="text-xs text-muted-foreground mb-1">Por tipo</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(data.by_type).filter(([, count]) => count > 0).map(([type, count]) => (
                    <Badge key={type} variant="outline" className="font-mono text-[10px]">
                      {TYPE_LABEL[type] ?? type}: {count}
                    </Badge>
                  ))}
                  {Object.values(data.by_type).every((c) => c === 0) && (
                    <span className="text-xs text-muted-foreground">nenhum</span>
                  )}
                </div>
              </div>
            </div>

            {data.top_users.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Usuários mais afetados</p>
                <div className="space-y-1">
                  {data.top_users.map((u) => (
                    <div key={u.user_id} className="flex items-center justify-between text-sm border-b border-border/20 py-1">
                      <span className="font-mono text-xs text-muted-foreground">{u.user_id}</span>
                      <Badge variant="outline" className="font-mono text-[10px]">{u.count} alerta(s)</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
