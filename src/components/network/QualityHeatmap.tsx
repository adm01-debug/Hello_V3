import { useEffect, useMemo, useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

const log = logger.create('QualityHeatmap');

interface Cell {
  dow: number;
  hour: number;
  count: number;
  mos_avg: number | null;
  jitter_p95: number | null;
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function colorFor(mos: number | null, count: number): string {
  if (count === 0 || mos === null) return 'bg-muted/20 border border-border/30';
  if (mos >= 4.0) return 'bg-success/70 border border-success';
  if (mos >= 3.5) return 'bg-warning/70 border border-warning';
  return 'bg-destructive/70 border border-destructive';
}

export function QualityHeatmap() {
  const [matrix, setMatrix] = useState<Cell[][]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSamples, setTotalSamples] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('voip-quality-heatmap', {
        body: null,
        method: 'GET',
      });
      if (error) throw error;
      const m = (data?.matrix ?? []) as Cell[][];
      setMatrix(m);
      setTotalSamples(data?.total_samples ?? 0);
    } catch (err) {
      log.error('Falha ao carregar heatmap', err);
      toast.error('Não foi possível carregar o heatmap');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const summary = useMemo(() => {
    let totalCells = 0, healthy = 0, degraded = 0;
    for (const row of matrix) {
      for (const c of row) {
        if (c.count === 0 || c.mos_avg === null) continue;
        totalCells++;
        if (c.mos_avg >= 4.0) healthy++;
        else if (c.mos_avg < 3.5) degraded++;
      }
    }
    return { totalCells, healthy, degraded };
  }, [matrix]);

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-start justify-between gap-3 flex-wrap">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Heatmap de Qualidade (7 dias)
          </CardTitle>
          <CardDescription>
            {totalSamples} amostras • {summary.healthy} bons / {summary.degraded} ruins / {summary.totalCells - summary.healthy - summary.degraded} medianos
          </CardDescription>
        </div>
        <Button onClick={load} size="sm" variant="ghost" disabled={loading}>
          <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} /> Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : matrix.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Sem dados de qualidade no período.</p>
        ) : (
          <TooltipProvider delayDuration={100}>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                {/* Header de horas */}
                <div className="flex items-center gap-1 mb-1 pl-10">
                  {Array.from({ length: 24 }).map((_, h) => (
                    <div key={h} className="w-6 text-center text-[9px] font-mono text-muted-foreground">
                      {h % 3 === 0 ? h : ''}
                    </div>
                  ))}
                </div>
                {/* Linhas por dia */}
                {matrix.map((row, dow) => (
                  <div key={dow} className="flex items-center gap-1 mb-1">
                    <div className="w-9 text-xs font-mono text-muted-foreground uppercase">{DAYS[dow]}</div>
                    {row.map((cell) => (
                      <Tooltip key={cell.hour}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'w-6 h-6 rounded-sm transition-all hover:scale-110 cursor-pointer',
                              colorFor(cell.mos_avg, cell.count),
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <div className="font-mono space-y-0.5">
                            <div><strong>{DAYS[cell.dow]} {String(cell.hour).padStart(2, '0')}h</strong></div>
                            <div>Chamadas: {cell.count}</div>
                            <div>MOS: {cell.mos_avg?.toFixed(2) ?? '—'}</div>
                            <div>Jitter p95: {cell.jitter_p95?.toFixed(1) ?? '—'}ms</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                ))}
                {/* Legenda */}
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-success/70 border border-success" /> MOS ≥ 4.0</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-warning/70 border border-warning" /> 3.5–4.0</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-destructive/70 border border-destructive" /> &lt; 3.5</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-muted/20 border border-border/30" /> Sem dados</span>
                </div>
              </div>
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
