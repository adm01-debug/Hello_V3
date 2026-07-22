import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Gauge, Activity, Clock, AlertCircle } from 'lucide-react';

interface HealthResponse {
  status: 'operational' | 'degraded' | 'outage' | 'unknown';
  components: {
    trunks: { status: string; uptime_pct: number; checks_15min: number };
    webhooks: { status: string; error_rate_pct: number; p95_latency_ms: number; attempts_15min: number };
    database: { status: string };
  };
  checked_at: string;
  window_minutes: number;
}

const SLO_TARGETS = {
  trunk_uptime: 99.9,
  webhook_error_rate: 1.0,
  webhook_p95_ms: 2000,
};

export default function SloDashboard() {
  useEffect(() => {
    document.title = 'SLO Dashboard · Objetivos de Serviço';
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['slo-health-snapshot'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('health-check', { body: {} });
      if (error) throw error;
      return data as HealthResponse;
    },
    refetchInterval: 30_000,
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Gauge className="h-6 w-6 text-primary" />
          SLO Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Objetivos de nível de serviço em janela de 15 min. Metas: uptime trunks &ge; 99.9%,
          erro webhook &lt; 1%, latência p95 &lt; 2s.
        </p>
      </header>

      {isLoading && <SloSkeleton />}
      {error && (
        <Card className="border-destructive">
          <CardContent className="py-6 text-destructive flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Falha ao consultar snapshot: {(error as Error).message}
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          <Card className={statusBorder(data.status)}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Status geral</span>
                <StatusBadge status={data.status} />
              </CardTitle>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SloCard
              title="Uptime Trunks VoIP"
              icon={<Activity className="h-4 w-4" />}
              value={`${data.components.trunks.uptime_pct.toFixed(2)}%`}
              target={`${SLO_TARGETS.trunk_uptime}%`}
              progress={data.components.trunks.uptime_pct}
              healthy={data.components.trunks.uptime_pct >= SLO_TARGETS.trunk_uptime}
              subtitle={`${data.components.trunks.checks_15min} health checks / 15min`}
            />
            <SloCard
              title="Erro Webhooks"
              icon={<AlertCircle className="h-4 w-4" />}
              value={`${data.components.webhooks.error_rate_pct.toFixed(2)}%`}
              target={`< ${SLO_TARGETS.webhook_error_rate}%`}
              progress={100 - Math.min(100, data.components.webhooks.error_rate_pct * 20)}
              healthy={data.components.webhooks.error_rate_pct < SLO_TARGETS.webhook_error_rate}
              subtitle={`${data.components.webhooks.attempts_15min} tentativas / 15min`}
            />
            <SloCard
              title="Latência webhook p95"
              icon={<Clock className="h-4 w-4" />}
              value={`${data.components.webhooks.p95_latency_ms}ms`}
              target={`< ${SLO_TARGETS.webhook_p95_ms}ms`}
              progress={100 - Math.min(100, (data.components.webhooks.p95_latency_ms / SLO_TARGETS.webhook_p95_ms) * 100)}
              healthy={data.components.webhooks.p95_latency_ms < SLO_TARGETS.webhook_p95_ms}
              subtitle="Janela 15min"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Última verificação: {new Date(data.checked_at).toLocaleString('pt-BR')}
          </p>
        </>
      )}
    </div>
  );
}

function SloCard(props: {
  title: string;
  icon: React.ReactNode;
  value: string;
  target: string;
  progress: number;
  healthy: boolean;
  subtitle: string;
}) {
  return (
    <Card className={props.healthy ? '' : 'border-destructive'}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {props.icon}
          {props.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold">{props.value}</span>
          <span className="text-xs text-muted-foreground">meta {props.target}</span>
        </div>
        <Progress value={Math.max(0, Math.min(100, props.progress))} />
        <p className="text-xs text-muted-foreground">{props.subtitle}</p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'operational') return <Badge>Operacional</Badge>;
  if (status === 'degraded') return <Badge variant="secondary">Degradado</Badge>;
  if (status === 'outage') return <Badge variant="destructive">Indisponível</Badge>;
  return <Badge variant="outline">Desconhecido</Badge>;
}

function statusBorder(status: string): string {
  if (status === 'outage') return 'border-destructive';
  if (status === 'degraded') return 'border-warning';
  return '';
}

function SloSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}><CardContent className="h-32 animate-pulse bg-muted/40" /></Card>
      ))}
    </div>
  );
}
