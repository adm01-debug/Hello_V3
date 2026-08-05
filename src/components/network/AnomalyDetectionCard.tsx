import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Activity, Zap, ShieldCheck, X } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, ReferenceLine, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useVoipAnomalies, type DetectedAnomaly, type AnomalyKind } from '@/hooks/useVoipAnomalies';
import { useAnomalyRemediation } from '@/hooks/useAnomalyRemediation';

const DOW_LABEL = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const METRIC_LABEL: Record<string, string> = { mos: 'MOS', jitter: 'Jitter', volume: 'Volume' };
const KIND_LABEL: Record<AnomalyKind, string> = {
  spike: 'Pico isolado',
  drift: 'Tendência sustentada',
  outage: 'Queda crítica',
};
const KIND_ICON: Record<AnomalyKind, typeof Zap> = {
  spike: Zap,
  drift: Activity,
  outage: AlertTriangle,
};

const AUTO_KEY = 'voip-anomaly-auto-remediate';

function buildSparkline(a: DetectedAnomaly) {
  // Gera 8 pontos sintéticos centrados no baseline com último ponto = observed.
  const baseline = a.expected;
  const points = Array.from({ length: 7 }, (_, i) => ({
    i,
    value: +(baseline + (Math.sin(i * 1.3 + a.bucket_hour) * a.std * 0.4)).toFixed(2),
  }));
  points.push({ i: 7, value: a.observed });
  return points;
}

export const AnomalyDetectionCard = () => {
  const { data, isLoading } = useVoipAnomalies();
  const remediate = useAnomalyRemediation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const anomalies = data ?? [];

  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [autoEnabled, setAutoEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(AUTO_KEY) === '1';
  });
  const [confirming, setConfirming] = useState<DetectedAnomaly | null>(null);
  const autoFiredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTO_KEY, autoEnabled ? '1' : '0');
    }
  }, [autoEnabled]);

  // Auto-remediação para outages quando toggle ativo
  useEffect(() => {
    if (!autoEnabled) return;
    anomalies
      .filter((a) => a.kind === 'outage' && !dismissed.has(a.id) && !autoFiredRef.current.has(a.id))
      .forEach((a) => {
        autoFiredRef.current.add(a.id);
        remediate.mutate({ anomalyId: a.id, metric: a.metric, kind: a.kind, silent: false });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoEnabled, anomalies, dismissed, remediate]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const visible = useMemo(() => anomalies.filter((a) => !dismissed.has(a.id)), [anomalies, dismissed]);

  const handleApply = (a: DetectedAnomaly) => {
    remediate.mutate({ anomalyId: a.id, metric: a.metric, kind: a.kind });
    setConfirming(null);
  };

  return (
    <>
      <Card className="glass-card" id="anomaly-detection">
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Detecção de Anomalias (24h)
              </CardTitle>
              <CardDescription>
                Z-score vs baseline 7d • spike / drift / outage com remediação confiável
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <Label htmlFor="auto-remediate" className="text-xs cursor-pointer">
                  Auto-remediação (outage)
                </Label>
                <Switch
                  id="auto-remediate"
                  checked={autoEnabled}
                  onCheckedChange={setAutoEnabled}
                />
              </div>
              {visible.length > 0 && (
                <Badge variant="outline" className="font-mono">
                  {visible.length} {visible.length === 1 ? 'anomalia' : 'anomalias'}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : visible.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhuma anomalia ativa. Operação dentro do baseline esperado.
            </p>
          ) : (
            <div className="space-y-2">
              {visible.map((a) => {
                const KindIcon = KIND_ICON[a.kind];
                const isCritical = a.severity === 'critical';
                const spark = buildSparkline(a);
                return (
                  <div
                    key={a.id}
                    className={cn(
                      'flex items-center gap-3 rounded-md border p-3 text-sm',
                      isCritical
                        ? 'border-destructive/30 bg-destructive/5'
                        : 'border-warning/30 bg-warning/5',
                    )}
                  >
                    <KindIcon
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        isCritical ? 'text-destructive' : 'text-warning',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {METRIC_LABEL[a.metric]} • {KIND_LABEL[a.kind]}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'font-mono text-[10px]',
                            isCritical
                              ? 'border-destructive/40 text-destructive'
                              : 'border-warning/40 text-warning',
                          )}
                        >
                          z={a.z_score > 0 ? '+' : ''}
                          {a.z_score}
                        </Badge>
                        <span className="text-muted-foreground font-mono text-xs">
                          {DOW_LABEL[a.bucket_dow]} {String(a.bucket_hour).padStart(2, '0')}h
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        observado <span className="text-foreground">{a.observed}</span> • esperado{' '}
                        <span className="text-foreground">{a.expected}</span> ± {a.std}
                      </div>
                    </div>
                    <div className="hidden sm:block w-24 h-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={spark}>
                          <YAxis hide domain={['dataMin', 'dataMax']} />
                          <Tooltip
                            contentStyle={{
                              background: 'hsl(var(--popover))',
                              border: '1px solid hsl(var(--border))',
                              fontSize: 11,
                            }}
                            labelFormatter={() => ''}
                          />
                          <ReferenceLine
                            y={a.expected}
                            stroke="hsl(var(--muted-foreground))"
                            strokeDasharray="2 2"
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke={
                              isCritical
                                ? 'hsl(var(--destructive))'
                                : 'hsl(var(--warning))'
                            }
                            strokeWidth={2}
                            dot={{ r: 1.5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs"
                        disabled={remediate.isPending}
                        onClick={() => setConfirming(a)}
                      >
                        Remediar
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => setDismissed((s) => new Set(s).add(a.id))}
                        aria-label="Dispensar anomalia"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!confirming} onOpenChange={(o) => !o && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aplicar remediação automática?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirming && (
                <>
                  Anomalia <strong>{METRIC_LABEL[confirming.metric]}</strong> classificada como{' '}
                  <strong>{KIND_LABEL[confirming.kind]}</strong>. A ação será registrada no histórico
                  e tem idempotência de 1h. Apenas ações pré-aprovadas (não destrutivas) são
                  executadas.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirming && handleApply(confirming)}>
              Aplicar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
