import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Gauge, TrendingDown, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

const log = logger.create('SlaReport');

interface PeriodStats {
  total_calls: number;
  sla_pct: number | null;
  mos_avg: number | null;
  jitter_p95_ms: number | null;
  rtt_p95_ms: number | null;
  packet_loss_avg_pct: number | null;
}

interface SlaReport {
  period: 'day' | 'week' | 'month';
  since: string;
  current: PeriodStats;
  previous: PeriodStats;
}

const PERIOD_LABEL: Record<string, string> = { day: '24 horas', week: '7 dias', month: '30 dias' };

function delta(curr: number | null, prev: number | null): { text: string; positive: boolean } | null {
  if (curr == null || prev == null || prev === 0) return null;
  const diff = curr - prev;
  const pct = ((diff / prev) * 100).toFixed(1);
  return { text: `${diff >= 0 ? '+' : ''}${pct}%`, positive: diff >= 0 };
}

export function SlaReportCards({ period = 'week' }: { period?: 'day' | 'week' | 'month' }) {
  const [report, setReport] = useState<SlaReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('voip-sla-report', {
          method: 'GET',
          body: undefined,
          // edge function lê ?period= via URL — fallback abaixo
        });
        // supabase-js não envia query params via invoke; faz fetch manual:
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const url = `https://${projectId}.supabase.co/functions/v1/voip-sla-report?period=${period}`;
        const session = (await supabase.auth.getSession()).data.session;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${session?.access_token ?? ''}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as SlaReport;
        if (!cancelled) setReport(json);
        if (error) log.warn('invoke fallback usado', error);
        if (data) log.debug('invoke response (descartado)', data);
      } catch (err) {
        log.error('Falha ao carregar SLA', err);
        if (!cancelled) toast.error('Não foi possível carregar relatório SLA');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [period]);

  const exportCsv = () => {
    if (!report) return;
    const rows = [
      ['Métrica', 'Período atual', 'Período anterior'],
      ['Total de chamadas', report.current.total_calls, report.previous.total_calls],
      ['SLA (MOS≥4.0) %', report.current.sla_pct ?? '—', report.previous.sla_pct ?? '—'],
      ['MOS médio', report.current.mos_avg ?? '—', report.previous.mos_avg ?? '—'],
      ['Jitter p95 (ms)', report.current.jitter_p95_ms ?? '—', report.previous.jitter_p95_ms ?? '—'],
      ['RTT p95 (ms)', report.current.rtt_p95_ms ?? '—', report.previous.rtt_p95_ms ?? '—'],
      ['Packet loss médio %', report.current.packet_loss_avg_pct ?? '—', report.previous.packet_loss_avg_pct ?? '—'],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voip-sla-${report.period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado');
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
      </div>
    );
  }

  if (!report) return null;

  const slaDelta = delta(report.current.sla_pct, report.previous.sla_pct);
  const jitterDelta = delta(report.current.jitter_p95_ms, report.previous.jitter_p95_ms);
  const rttDelta = delta(report.current.rtt_p95_ms, report.previous.rtt_p95_ms);
  const slaPct = report.current.sla_pct ?? 0;
  const slaColor = slaPct >= 95 ? 'text-success' : slaPct >= 85 ? 'text-warning' : 'text-destructive';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-display">SLA dos últimos {PERIOD_LABEL[report.period]}</h2>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={!report.current.total_calls}>
          <Download className="mr-2 h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardDescription>SLA (MOS ≥ 4.0)</CardDescription>
            <CardTitle className="flex items-baseline gap-2">
              <Gauge className={cn('h-5 w-5', slaColor)} />
              <span className={cn('text-3xl font-mono', slaColor)}>{report.current.sla_pct ?? '—'}</span>
              <span className="text-sm text-muted-foreground">%</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <div>{report.current.total_calls} chamadas analisadas</div>
            {slaDelta && (
              <div className={cn('flex items-center gap-1', slaDelta.positive ? 'text-success' : 'text-destructive')}>
                {slaDelta.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {slaDelta.text} vs período anterior
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardDescription>Jitter p95</CardDescription>
            <CardTitle className="flex items-baseline gap-2">
              <span className="text-3xl font-mono">{report.current.jitter_p95_ms ?? '—'}</span>
              <span className="text-sm text-muted-foreground">ms</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {jitterDelta && (
              <div className={cn('flex items-center gap-1', !jitterDelta.positive ? 'text-success' : 'text-destructive')}>
                {jitterDelta.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {jitterDelta.text} vs período anterior
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardDescription>RTT p95</CardDescription>
            <CardTitle className="flex items-baseline gap-2">
              <span className="text-3xl font-mono">{report.current.rtt_p95_ms ?? '—'}</span>
              <span className="text-sm text-muted-foreground">ms</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {rttDelta && (
              <div className={cn('flex items-center gap-1', !rttDelta.positive ? 'text-success' : 'text-destructive')}>
                {rttDelta.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {rttDelta.text} vs período anterior
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
