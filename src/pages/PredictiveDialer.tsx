import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gauge, Activity, RefreshCw, Zap } from 'lucide-react';
import { useCampaignPacing, useApplyPacingNow } from '@/hooks/usePredictivePacing';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Campaign {
  id: string;
  name: string;
  status: string;
  max_concurrent_calls: number;
  target_abandon_rate: number;
  last_pacing_reason: string | null;
  last_pacing_adjustment_at: string | null;
}

export default function PredictiveDialer() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Discador Preditivo · Pacing Automático';
  }, []);

  const { data: campaigns } = useQuery({
    queryKey: ['dialer-campaigns', 'predictive'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dialer_campaigns')
        .select('id, name, status, max_concurrent_calls, target_abandon_rate, last_pacing_reason, last_pacing_adjustment_at')
        .eq('mode', 'predictive')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Campaign[];
    },
    refetchInterval: 15_000,
  });

  useEffect(() => {
    if (!selectedId && campaigns?.length) setSelectedId(campaigns[0].id);
  }, [campaigns, selectedId]);

  const { data: pacing } = useCampaignPacing(selectedId);
  const applyNow = useApplyPacingNow();

  const abandonPct = pacing ? Number(pacing.abandon_rate) * 100 : 0;
  const connectPct = pacing ? Number(pacing.connect_rate) * 100 : 0;
  const isOverTarget = pacing && abandonPct > pacing.target_abandon_rate;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gauge className="h-6 w-6 text-primary" />
            Discador Preditivo — Pacing Inteligente
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ajuste automático de chamadas por agente conforme abandono, taxa de conexão e AHT.
            Meta Anatel: abandono &lt; 3%.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={selectedId ?? ''} onValueChange={setSelectedId}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Selecione a campanha" />
            </SelectTrigger>
            <SelectContent>
              {campaigns?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} <span className="text-muted-foreground ml-2">({c.status})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => applyNow.mutate()} disabled={applyNow.isPending} variant="secondary">
            <RefreshCw className={`h-4 w-4 mr-2 ${applyNow.isPending ? 'animate-spin' : ''}`} />
            Aplicar pacing agora
          </Button>
        </div>
      </header>

      {!pacing ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {campaigns?.length === 0
              ? 'Nenhuma campanha preditiva cadastrada.'
              : 'Selecione uma campanha para visualizar o pacing.'}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Pace atual"
              value={String(pacing.current_pace)}
              suffix="ch/agente"
              icon={<Zap className="h-4 w-4" />}
            />
            <MetricCard
              title="Pace sugerido"
              value={String(pacing.suggested_pace)}
              suffix="ch/agente"
              highlight={pacing.suggested_pace !== pacing.current_pace}
              icon={<Activity className="h-4 w-4" />}
            />
            <MetricCard
              title="Abandono"
              value={abandonPct.toFixed(2)}
              suffix="%"
              danger={!!isOverTarget}
              icon={<Activity className="h-4 w-4" />}
            />
            <MetricCard
              title="Taxa conexão"
              value={connectPct.toFixed(1)}
              suffix="%"
              icon={<Activity className="h-4 w-4" />}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Diagnóstico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Agentes disponíveis" value={String(pacing.free_agents)} />
              <Row label="AHT (últ. 60min)" value={`${pacing.aht_seconds}s`} />
              <Row label="Alvo de abandono" value={`${pacing.target_abandon_rate}%`} />
              <Row
                label="Motivo do último ajuste"
                value={
                  <Badge variant={isOverTarget ? 'destructive' : 'secondary'}>
                    {pacing.reason}
                  </Badge>
                }
              />
              <Row
                label="Calculado"
                value={formatDistanceToNow(new Date(pacing.computed_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  suffix,
  icon,
  highlight,
  danger,
}: {
  title: string;
  value: string;
  suffix?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <Card className={danger ? 'border-destructive' : highlight ? 'border-primary' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          {suffix && <span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
