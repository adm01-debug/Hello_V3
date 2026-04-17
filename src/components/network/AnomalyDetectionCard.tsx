import { useEffect, useState } from 'react';
import { AlertTriangle, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

const log = logger.create('AnomalyDetectionCard');

interface Anomaly {
  metric: 'mos' | 'jitter' | 'volume';
  expected: number;
  observed: number;
  std: number;
  z_score: number;
  severity: 'warning' | 'critical';
  started_at: string;
  bucket_hour: number;
  bucket_dow: number;
}

const DOW_LABEL = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const METRIC_LABEL: Record<string, string> = { mos: 'MOS', jitter: 'Jitter', volume: 'Volume' };

export const AnomalyDetectionCard = () => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('voip-anomaly-detector', {
        body: undefined,
      });
      if (error) throw error;
      setAnomalies((data?.anomalies || []) as Anomaly[]);
    } catch (err) {
      log.error('Falha ao detectar anomalias', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Detecção de Anomalias (24h)
            </CardTitle>
            <CardDescription>Desvios estatísticos vs baseline de 7 dias (z-score)</CardDescription>
          </div>
          {anomalies.length > 0 && (
            <Badge variant="outline" className="font-mono">
              {anomalies.length} {anomalies.length === 1 ? 'anomalia' : 'anomalias'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : anomalies.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nenhuma anomalia detectada. Operação dentro do baseline esperado.
          </p>
        ) : (
          <div className="space-y-2">
            {anomalies.map((a, i) => {
              const isCritical = a.severity === 'critical';
              return (
                <div
                  key={i}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-md border p-3 text-sm',
                    isCritical
                      ? 'border-destructive/30 bg-destructive/5'
                      : 'border-warning/30 bg-warning/5'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <AlertTriangle
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        isCritical ? 'text-destructive' : 'text-warning'
                      )}
                    />
                    <div className="min-w-0">
                      <div className="font-medium">
                        {METRIC_LABEL[a.metric]} anômalo •{' '}
                        <span className="text-muted-foreground font-mono text-xs">
                          {DOW_LABEL[a.bucket_dow]} {String(a.bucket_hour).padStart(2, '0')}h
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        observado <span className="text-foreground">{a.observed}</span> • esperado{' '}
                        <span className="text-foreground">{a.expected}</span> ± {a.std}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'font-mono text-[10px]',
                      isCritical ? 'border-destructive/40 text-destructive' : 'border-warning/40 text-warning'
                    )}
                  >
                    z={a.z_score > 0 ? '+' : ''}{a.z_score}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
