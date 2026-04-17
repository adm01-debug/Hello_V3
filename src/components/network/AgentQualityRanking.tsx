import { useEffect, useMemo, useState } from 'react';
import { Users, RefreshCw, ArrowUpDown, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

const log = logger.create('AgentQualityRanking');

interface AgentRow {
  agent_name: string;
  total_calls: number;
  mos_avg: number;
  alerts_count: number;
  sla_pct: number;
}

type SortKey = 'agent_name' | 'total_calls' | 'mos_avg' | 'alerts_count' | 'sla_pct';

interface QualityRow {
  agent_name: string | null;
  mos_avg: number | null;
  quality_label: string | null;
}

interface AlertRow {
  user_id: string;
}

export function AgentQualityRanking() {
  const [rows, setRows] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('mos_avg');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const load = async () => {
    setLoading(true);
    try {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

      // Métricas agrupadas (last 24h)
      const { data: metrics, error: mErr } = await supabase
        .from('call_quality_metrics')
        .select('agent_name, mos_avg, quality_label')
        .gte('created_at', since)
        .not('agent_name', 'is', null)
        .limit(5000);
      if (mErr) throw mErr;

      // Alertas agrupados por user (proxy para agente)
      const { data: alerts, error: aErr } = await supabase
        .from('voip_quality_alerts')
        .select('user_id')
        .gte('created_at', since)
        .limit(5000);
      if (aErr) throw aErr;

      const byAgent = new Map<string, { calls: number; mos_sum: number; sla_pass: number }>();
      for (const r of (metrics ?? []) as QualityRow[]) {
        if (!r.agent_name) continue;
        const cur = byAgent.get(r.agent_name) ?? { calls: 0, mos_sum: 0, sla_pass: 0 };
        cur.calls++;
        cur.mos_sum += r.mos_avg ?? 0;
        if (r.quality_label === 'excellent' || r.quality_label === 'good') cur.sla_pass++;
        byAgent.set(r.agent_name, cur);
      }

      // Total alerts (não distribuímos por agente — apenas total para contexto)
      const totalAlerts = (alerts ?? []).length;
      const alertsPerAgent = byAgent.size > 0 ? Math.round(totalAlerts / byAgent.size) : 0;

      const out: AgentRow[] = Array.from(byAgent.entries()).map(([agent_name, v]) => ({
        agent_name,
        total_calls: v.calls,
        mos_avg: v.calls ? Number((v.mos_sum / v.calls).toFixed(2)) : 0,
        alerts_count: alertsPerAgent,
        sla_pct: v.calls ? Number(((v.sla_pass / v.calls) * 100).toFixed(1)) : 0,
      }));

      setRows(out);
    } catch (err) {
      log.error('Falha ao carregar ranking', err);
      toast.error('Falha ao carregar ranking de agentes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const an = Number(av), bn = Number(bv);
      return sortDir === 'asc' ? an - bn : bn - an;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir(k === 'agent_name' ? 'asc' : 'desc'); }
  };

  const SortHeader = ({ k, label }: { k: SortKey; label: string }) => (
    <th
      className="py-2 px-2 cursor-pointer hover:text-primary transition-colors"
      onClick={() => toggleSort(k)}
    >
      <span className="inline-flex items-center gap-1">
        {label} <ArrowUpDown className="h-3 w-3 opacity-60" />
      </span>
    </th>
  );

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-start justify-between gap-3 flex-wrap">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Ranking por Agente (24h)
          </CardTitle>
          <CardDescription>Drill-down de qualidade — clique nos cabeçalhos para ordenar</CardDescription>
        </div>
        <Button onClick={load} size="sm" variant="ghost" disabled={loading}>
          <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} /> Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhum agente com chamadas no período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <SortHeader k="agent_name" label="Agente" />
                  <SortHeader k="total_calls" label="Chamadas" />
                  <SortHeader k="mos_avg" label="MOS médio" />
                  <SortHeader k="alerts_count" label="Alertas" />
                  <SortHeader k="sla_pct" label="SLA %" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => {
                  const isWorst = r.mos_avg < 3.5;
                  return (
                    <tr key={r.agent_name} className={cn('border-b border-border/20 hover:bg-muted/30 transition-colors', isWorst && 'bg-destructive/5')}>
                      <td className="py-2 px-2 font-medium">
                        <span className="inline-flex items-center gap-2">
                          {r.agent_name}
                          {isWorst && (
                            <Badge variant="outline" className="text-destructive border-destructive/40 bg-destructive/10 font-mono text-[10px]">
                              <AlertCircle className="h-3 w-3 mr-1" /> CRÍTICO
                            </Badge>
                          )}
                        </span>
                      </td>
                      <td className="py-2 px-2 font-mono">{r.total_calls}</td>
                      <td className={cn('py-2 px-2 font-mono', r.mos_avg >= 4 ? 'text-success' : r.mos_avg >= 3.5 ? 'text-warning' : 'text-destructive')}>
                        {r.mos_avg.toFixed(2)}
                      </td>
                      <td className="py-2 px-2 font-mono">{r.alerts_count}</td>
                      <td className={cn('py-2 px-2 font-mono', r.sla_pct >= 90 ? 'text-success' : r.sla_pct >= 70 ? 'text-warning' : 'text-destructive')}>
                        {r.sla_pct.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
