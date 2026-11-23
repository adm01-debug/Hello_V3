import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Database, Network, Shield, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface HealthComponent {
  status: 'operational' | 'degraded' | 'outage' | 'unknown';
  uptime_pct?: number | null;
  error_rate_pct?: number | null;
  latency_ms?: number | null;
  checks_15min?: number;
  p95_latency_ms?: number | null;
}

interface HealthCheckResponse {
  status: 'operational' | 'degraded' | 'outage' | 'unknown';
  components: {
    trunks?: HealthComponent;
    webhooks?: HealthComponent;
    database?: HealthComponent;
  };
  checked_at?: string;
}

interface RlsRow {
  table_name: string;
  rls_enabled: boolean;
}

const componentLabel: Record<string, { title: string; icon: React.ReactNode; hint: string }> = {
  trunks: { title: 'SIP Gateway', icon: <Network className="h-4 w-4" />, hint: 'Uptime dos troncos (15 min)' },
  webhooks: { title: 'Webhooks', icon: <CheckCircle className="h-4 w-4" />, hint: 'Taxa de erro (15 min)' },
  database: { title: 'Supabase DB', icon: <Database className="h-4 w-4" />, hint: 'Latência de conexão' },
};

function statusBadge(status?: string) {
  if (!status || status === 'unknown') {
    return <Badge variant="outline" className="text-[9px] bg-muted/5 text-muted-foreground border-muted/20">Sem medição</Badge>;
  }
  if (status === 'operational') {
    return <Badge variant="outline" className="text-[9px] bg-success/5 text-success border-success/20">Operacional</Badge>;
  }
  if (status === 'degraded') {
    return <Badge variant="outline" className="text-[9px] bg-warning/5 text-warning border-warning/20">Degradado</Badge>;
  }
  return <Badge variant="outline" className="text-[9px] bg-destructive/5 text-destructive border-destructive/20">Indisponível</Badge>;
}

function latencyText(component?: HealthComponent) {
  if (!component || component.status === 'unknown') return 'Sem medição';
  if (component.latency_ms != null) return `${component.latency_ms}ms`;
  if (component.uptime_pct != null) return `${component.uptime_pct.toFixed(2)}% uptime`;
  if (component.error_rate_pct != null) return `${component.error_rate_pct.toFixed(2)}% erro`;
  return 'Medido';
}

export function SystemIntegrityDashboard() {
  const [components, setComponents] = useState<Record<string, HealthComponent> | null>(null);
  const [rls, setRls] = useState<{ protectedCount: number; totalCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthRes, rlsRes] = await Promise.all([
        supabase.functions.invoke('health-check', { method: 'GET' }),
        supabase.rpc('check_all_tables_rls_status'),
      ]);

      if (healthRes.error) {
        logger.error('SystemIntegrity: health-check failed', healthRes.error);
        setComponents(null);
      } else {
        const data = (healthRes.data as HealthCheckResponse) || {};
        setComponents(data.components || null);
      }

      if (rlsRes.error) {
        logger.error('SystemIntegrity: RLS check failed', rlsRes.error);
        setRls(null);
      } else {
        const rows = (rlsRes.data as RlsRow[]) || [];
        setRls({
          protectedCount: rows.filter(r => r.rls_enabled).length,
          totalCount: rows.length,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar integridade';
      logger.error('SystemIntegrity: load failed', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const entries = Object.entries(componentLabel);

  return (
    <Card className="glass-neon border-primary/10">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          Integridade da Infraestrutura
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={load} disabled={loading} aria-label="Atualizar integridade">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {error && (
          <div className="col-span-4 flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Não foi possível carregar a integridade: {error}
          </div>
        )}

        {entries.map(([key, meta]) => {
          const component = components?.[key];
          const status = component?.status ?? 'unknown';
          return (
            <div key={key} className="flex flex-col gap-1 p-3 rounded-lg border bg-accent/20">
              <div className="flex items-center justify-between mb-1">
                <span className="p-1.5 rounded-md bg-background/50">{meta.icon}</span>
                {statusBadge(status)}
              </div>
              <p className="text-xs font-semibold">{meta.title}</p>
              <p className="text-[10px] text-muted-foreground">
                {component && component.status !== 'unknown' ? latencyText(component) : 'Sem medição'}
              </p>
              <p className="text-[9px] text-muted-foreground/70">{meta.hint}</p>
            </div>
          );
        })}

        <div className="flex flex-col gap-1 p-3 rounded-lg border bg-accent/20">
          <div className="flex items-center justify-between mb-1">
            <span className="p-1.5 rounded-md bg-background/50"><Shield className="h-4 w-4" /></span>
            {rls && rls.totalCount > 0
              ? <Badge variant="outline" className="text-[9px] bg-success/5 text-success border-success/20">Protegido</Badge>
              : <Badge variant="outline" className="text-[9px] bg-muted/5 text-muted-foreground border-muted/20">Sem medição</Badge>}
          </div>
          <p className="text-xs font-semibold">RLS Policies</p>
          <p className="text-[10px] text-muted-foreground">
            {rls ? `${rls.protectedCount} tabelas, ${rls.totalCount - rls.protectedCount} sem RLS` : 'Sem medição'}
          </p>
          <p className="text-[9px] text-muted-foreground/70">Medição via RPC</p>
        </div>
      </CardContent>
    </Card>
  );
}
