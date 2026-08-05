import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertTriangle, Waves } from 'lucide-react';

interface QualityAggregate {
  agent_name: string | null;
  trunk_name: string | null;
  mos_avg: number;
  jitter_avg_ms: number;
  packet_loss_pct: number;
  sample_count: number;
}

export default function VoiceQuality() {
  useEffect(() => {
    document.title = 'Qualidade de Voz · MOS/Jitter/Perda';
  }, []);

  const { data: rows } = useQuery({
    queryKey: ['voice-quality-aggregate'],
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { data, error } = await supabase
        .from('call_quality_metrics')
        .select('agent_name, mos_avg, jitter_avg_ms, packet_loss_pct, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;

      const map = new Map<string, { mos: number[]; jitter: number[]; loss: number[] }>();
      for (const r of data ?? []) {
        const key = r.agent_name ?? '—';
        if (!map.has(key)) map.set(key, { mos: [], jitter: [], loss: [] });
        const acc = map.get(key)!;
        if (r.mos_avg != null) acc.mos.push(Number(r.mos_avg));
        if (r.jitter_avg_ms != null) acc.jitter.push(Number(r.jitter_avg_ms));
        if (r.packet_loss_pct != null) acc.loss.push(Number(r.packet_loss_pct));
      }

      const avg = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
      const aggregated: QualityAggregate[] = [...map.entries()].map(([agent, v]) => ({
        agent_name: agent,
        trunk_name: null,
        mos_avg: Number(avg(v.mos).toFixed(2)),
        jitter_avg_ms: Number(avg(v.jitter).toFixed(1)),
        packet_loss_pct: Number(avg(v.loss).toFixed(2)),
        sample_count: v.mos.length,
      }));
      aggregated.sort((a, b) => a.mos_avg - b.mos_avg);
      return aggregated;
    },
    refetchInterval: 30_000,
  });

  const critical = (rows ?? []).filter((r) => r.mos_avg > 0 && r.mos_avg < 3.5);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Waves className="h-6 w-6 text-primary" />
          Qualidade de Voz (últimas 24h)
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          MOS, jitter e perda de pacotes agregados por agente. Alerta automático quando MOS &lt; 3.5.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" /> Agentes monitorados
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{rows?.length ?? 0}</div></CardContent>
        </Card>
        <Card className={critical.length > 0 ? 'border-destructive' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Críticos (MOS &lt; 3.5)
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{critical.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Amostras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(rows ?? []).reduce((s, r) => s + r.sample_count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Ranking por MOS</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agente</TableHead>
                <TableHead>MOS</TableHead>
                <TableHead>Jitter (ms)</TableHead>
                <TableHead>Perda (%)</TableHead>
                <TableHead>Amostras</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(rows ?? []).map((r) => (
                <TableRow key={r.agent_name ?? 'unknown'}>
                  <TableCell className="font-medium">{r.agent_name ?? '—'}</TableCell>
                  <TableCell>{r.mos_avg.toFixed(2)}</TableCell>
                  <TableCell>{r.jitter_avg_ms.toFixed(1)}</TableCell>
                  <TableCell>{r.packet_loss_pct.toFixed(2)}</TableCell>
                  <TableCell>{r.sample_count}</TableCell>
                  <TableCell>
                    {r.mos_avg < 3.5 ? (
                      <Badge variant="destructive">Crítico</Badge>
                    ) : r.mos_avg < 4 ? (
                      <Badge variant="secondary">Atenção</Badge>
                    ) : (
                      <Badge>Bom</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(rows ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    Sem métricas nas últimas 24h.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
