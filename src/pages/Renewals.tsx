import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, Award } from 'lucide-react';
import { useRenewals, type Renewal } from '@/hooks/useRenewals';
import { usePageTitle } from '@/hooks/usePageTitle';
import { NeonPageLayout } from '@/components/layout/NeonPageLayout';

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

function RenewalCard({ r }: { r: Renewal }) {
  const days = Math.ceil((new Date(r.due_date).getTime() - Date.now()) / 86400000);
  return (
    <div className="p-3 border rounded-lg hover:bg-accent/20 transition-colors">
      <div className="flex justify-between items-start gap-2">
        <div className="font-medium text-sm">{r.renewal_type === 'renewal' ? 'Renovação' : 'Expansão'}</div>
        <Badge variant="outline">{r.probability}%</Badge>
      </div>
      <div className="text-lg font-bold mt-1">{fmt(Number(r.proposed_value))}</div>
      <div className="text-xs text-muted-foreground mt-1">
        Vence em {days} dia{days !== 1 ? 's' : ''} · {r.owner_agent_name ?? 'Sem owner'}
      </div>
    </div>
  );
}

export default function Renewals() {
  usePageTitle('Pipeline de Renovações');
  const { loading, buckets, totals } = useRenewals();

  const cards = useMemo(() => [
    { title: 'Pipeline aberto', value: fmt(totals.pipeline_value), icon: TrendingUp },
    { title: 'Weighted forecast', value: fmt(totals.weighted_value), icon: TrendingUp },
    { title: 'Renovado YTD', value: fmt(totals.won_value), icon: Award },
  ], [totals]);

  return (
    <NeonPageLayout>
      <div>
        <h1 className="text-3xl font-bold">Pipeline de Renovações</h1>
        <p className="text-muted-foreground">Visibilidade 30/60/90 dias para renewals e expansões</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.title}><CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><c.icon className="h-4 w-4" />{c.title}</div>
            <div className="text-2xl font-bold mt-1">{c.value}</div>
          </CardContent></Card>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { title: '30 dias', items: buckets.d30, tone: 'border-red-500/40' },
            { title: '60 dias', items: buckets.d60, tone: 'border-amber-500/40' },
            { title: '90 dias', items: buckets.d90, tone: 'border-emerald-500/40' },
          ].map((col) => (
            <Card key={col.title} className={col.tone}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" /> {col.title}
                  <Badge variant="secondary" className="ml-auto">{col.items.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {col.items.length === 0
                  ? <p className="text-xs text-muted-foreground">Nenhuma renovação</p>
                  : col.items.map((r) => <RenewalCard key={r.id} r={r} />)}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </NeonPageLayout>
  );
}
