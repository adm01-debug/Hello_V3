import { useEffect, useMemo, useState } from 'react';
import { Activity, Wifi, WifiOff, RefreshCw, Phone, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useNetworkMonitor } from '@/hooks/useNetworkMonitor';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { SlaReportCards } from '@/components/network/SlaReportCards';
import { QualityAlertsCard } from '@/components/network/QualityAlertsCard';
import { QualityHeatmap } from '@/components/network/QualityHeatmap';
import { AgentQualityRanking } from '@/components/network/AgentQualityRanking';

const log = logger.create('NetworkDiagnostics');

interface QualityMetric {
  id: string;
  agent_name: string | null;
  channel: string;
  mos_avg: number | null;
  jitter_avg_ms: number | null;
  packet_loss_pct: number | null;
  rtt_avg_ms: number | null;
  quality_label: string | null;
  created_at: string;
  samples_count: number;
}

const QUALITY_COLORS: Record<string, string> = {
  excellent: 'text-success border-success/30 bg-success/10',
  good: 'text-primary border-primary/30 bg-primary/10',
  fair: 'text-warning border-warning/30 bg-warning/10',
  poor: 'text-destructive border-destructive/30 bg-destructive/10',
  unknown: 'text-muted-foreground border-border bg-muted/30',
};

const NetworkDiagnostics = () => {
  usePageTitle('Diagnóstico de Rede');
  const network = useNetworkMonitor();
  const [metrics, setMetrics] = useState<QualityMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [stunResult, setStunResult] = useState<string | null>(null);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('call_quality_metrics')
        .select('id, agent_name, channel, mos_avg, jitter_avg_ms, packet_loss_pct, rtt_avg_ms, quality_label, created_at, samples_count')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      setMetrics((data || []) as QualityMetric[]);
    } catch (err) {
      log.error('Erro ao carregar métricas', err);
      toast.error('Falha ao carregar histórico de qualidade');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMetrics(); }, []);

  const chartData = useMemo(() => {
    return [...metrics]
      .reverse()
      .map((m, i) => ({
        idx: i + 1,
        mos: m.mos_avg ?? 0,
        rtt: m.rtt_avg_ms ?? 0,
        jitter: m.jitter_avg_ms ?? 0,
        time: new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      }));
  }, [metrics]);

  const avgMos = useMemo(() => {
    const valid = metrics.filter(m => m.mos_avg !== null);
    if (!valid.length) return null;
    return (valid.reduce((s, m) => s + (m.mos_avg ?? 0), 0) / valid.length).toFixed(2);
  }, [metrics]);

  const runConnectivityTest = async () => {
    setTesting(true);
    setStunResult(null);
    try {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      pc.createDataChannel('test');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const candidates: string[] = [];
      const start = Date.now();
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 5000);
        pc.onicecandidate = (e) => {
          if (e.candidate) candidates.push(e.candidate.candidate);
          else { clearTimeout(timeout); resolve(); }
        };
      });
      const elapsed = Date.now() - start;
      pc.close();

      const hasSrflx = candidates.some(c => c.includes('typ srflx'));
      setStunResult(hasSrflx ? `STUN OK (${elapsed}ms, ${candidates.length} candidatos)` : 'STUN sem candidatos srflx');
      toast.success('Teste de conexão concluído', { description: `${candidates.length} candidatos ICE em ${elapsed}ms` });
    } catch (err) {
      log.error('Teste de conectividade falhou', err);
      setStunResult('Falha no teste STUN');
      toast.error('Teste de conexão falhou');
    } finally {
      setTesting(false);
    }
  };

  const NetIcon = network.status === 'offline' ? WifiOff : Wifi;
  const netColor = network.status === 'online' ? 'text-success' : network.status === 'unstable' ? 'text-warning' : 'text-destructive';

  return (
    <div className="space-y-6 relative">
      <div className="fixed inset-0 pointer-events-none gradient-mesh-intense opacity-20" />
      <div className="relative space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient text-display">
              Diagnóstico de Rede & VoIP
            </h1>
            <p className="text-muted-foreground">Monitoramento de internet local e qualidade das chamadas</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={runConnectivityTest} disabled={testing} variant="outline" size="sm">
              <Activity className={cn('mr-2 h-4 w-4', testing && 'animate-pulse')} />
              {testing ? 'Testando...' : 'Testar conexão'}
            </Button>
            <Button onClick={loadMetrics} variant="ghost" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
            </Button>
          </div>
        </div>

        {/* Status cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardDescription>Internet Local</CardDescription>
              <CardTitle className="flex items-center gap-2">
                <NetIcon className={cn('h-5 w-5', netColor)} />
                <span className={netColor}>{network.status.toUpperCase()}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Latência:</span><span className="font-mono">{network.latencyMs ? `${network.latencyMs}ms` : '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tipo:</span><span className="font-mono">{network.effectiveType || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Downlink:</span><span className="font-mono">{network.downlinkMbps ? `${network.downlinkMbps} Mbps` : '—'}</span></div>
              {stunResult && <div className="pt-2 mt-2 border-t border-border/40 text-xs text-muted-foreground">{stunResult}</div>}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardDescription>MOS médio (últimas 20)</CardDescription>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-3xl font-mono">{avgMos ?? '—'}</span>
                <span className="text-sm text-muted-foreground">/ 5.0</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Score de qualidade percebida (E-Model). Acima de 4.0 = boa; abaixo de 3.6 = ruim.
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardDescription>Chamadas analisadas</CardDescription>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                <span className="text-3xl font-mono">{metrics.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Métricas persistidas em <code className="font-mono">call_quality_metrics</code>.
            </CardContent>
          </Card>
        </div>

        {/* Onda 11 — SLA report cards */}
        <SlaReportCards period="week" />

        {/* Onda 13 — Heatmap de qualidade 7d */}
        <QualityHeatmap />

        {/* Onda 13 — Ranking por agente */}
        <AgentQualityRanking />

        {/* Onda 12 — Alertas persistentes de qualidade */}
        <QualityAlertsCard />

        {/* MOS chart */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Evolução do MOS</CardTitle>
            <CardDescription>Últimas {metrics.length} chamadas</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">Sem métricas registradas ainda. Faça uma chamada SIP para coletar dados.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis domain={[1, 5]} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <RTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="mos" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Histórico tabela */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Histórico de Qualidade</CardTitle>
            <CardDescription>Detalhes por chamada</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : metrics.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma métrica encontrada.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="py-2 px-2">Quando</th>
                      <th className="py-2 px-2">Agente</th>
                      <th className="py-2 px-2">Canal</th>
                      <th className="py-2 px-2">MOS</th>
                      <th className="py-2 px-2">Jitter</th>
                      <th className="py-2 px-2">Loss</th>
                      <th className="py-2 px-2">RTT</th>
                      <th className="py-2 px-2">Qualidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((m) => (
                      <tr key={m.id} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                        <td className="py-2 px-2 font-mono text-xs">{new Date(m.created_at).toLocaleString('pt-BR')}</td>
                        <td className="py-2 px-2">{m.agent_name || '—'}</td>
                        <td className="py-2 px-2 uppercase text-xs">{m.channel}</td>
                        <td className="py-2 px-2 font-mono">{m.mos_avg?.toFixed(2) ?? '—'}</td>
                        <td className="py-2 px-2 font-mono">{m.jitter_avg_ms?.toFixed(1) ?? '—'}ms</td>
                        <td className="py-2 px-2 font-mono">{m.packet_loss_pct?.toFixed(2) ?? '—'}%</td>
                        <td className="py-2 px-2 font-mono">{m.rtt_avg_ms?.toFixed(0) ?? '—'}ms</td>
                        <td className="py-2 px-2">
                          <Badge variant="outline" className={cn('font-mono text-[10px] uppercase', QUALITY_COLORS[m.quality_label || 'unknown'])}>
                            {m.quality_label || 'unknown'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NetworkDiagnostics;
