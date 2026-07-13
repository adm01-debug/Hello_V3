import { DollarSign, TrendingUp, TrendingDown, Phone, Trophy, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { NeonPageLayout } from '@/components/layout/NeonPageLayout';
import { NeonPageHeader } from '@/components/layout/NeonPageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useFinancialImpact, financialImpactToCSV } from '@/hooks/useFinancialImpact';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { toast } from 'sonner';

const brl = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

const fmtDelta = (v: number, unit: '%' | 'pp' = '%') => `${v > 0 ? '+' : ''}${v}${unit}`;

interface KPI {
  label: string;
  value: string;
  icon: typeof DollarSign;
  positive: boolean;
  delta: number;
  deltaUnit: '%' | 'pp';
  /** Se true, delta positivo é ruim (ex.: custo, CAC) */
  inverse?: boolean;
}

export default function FinancialImpact() {
  usePageTitle('Impacto Financeiro');
  const [days, setDays] = useState<number>(30);
  const { data, isLoading } = useFinancialImpact(days);

  const summary = data?.summary;
  const deltas = data?.deltas;

  const kpis: KPI[] = [
    { label: 'Receita', value: brl(summary?.total_revenue_cents ?? 0), icon: DollarSign, positive: true, delta: deltas?.revenue_pct ?? 0, deltaUnit: '%' },
    { label: 'Custo estimado', value: brl(summary?.total_cost_cents ?? 0), icon: Phone, positive: false, delta: deltas?.cost_pct ?? 0, deltaUnit: '%', inverse: true },
    { label: 'Lucro', value: brl(summary?.total_profit_cents ?? 0), icon: (summary?.total_profit_cents ?? 0) >= 0 ? TrendingUp : TrendingDown, positive: (summary?.total_profit_cents ?? 0) >= 0, delta: deltas?.profit_pct ?? 0, deltaUnit: '%' },
    { label: 'ROI', value: `${summary?.roi_percent ?? 0}%`, icon: TrendingUp, positive: (summary?.roi_percent ?? 0) >= 0, delta: deltas?.roi_pct_points ?? 0, deltaUnit: 'pp' },
    { label: 'Deals ganhos', value: String(summary?.total_deals_won ?? 0), icon: Trophy, positive: true, delta: deltas?.deals_pct ?? 0, deltaUnit: '%' },
    { label: 'CAC / deal', value: brl(summary?.cac_cents ?? 0), icon: DollarSign, positive: false, delta: deltas?.cac_pct ?? 0, deltaUnit: '%', inverse: true },
  ];

  const chartData = (data?.series ?? []).map((d) => ({
    day: new Date(d.day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    Receita: d.revenue_cents / 100,
    Custo: d.estimated_cost_cents / 100,
    Lucro: d.profit_cents / 100,
  }));

  const handleExportCSV = () => {
    if (!data?.series?.length) {
      toast.info('Sem dados no período para exportar');
      return;
    }
    const csv = financialImpactToCSV(data.series);
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-impact-${days}d-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success('CSV exportado');
  };

  return (
    <NeonPageLayout>
      <NeonPageHeader
        title="Impacto Financeiro"
        description="Custo por chamada × receita por deal (com comparação vs período anterior)"
        icon={<DollarSign />}
        actions={
          <div className="flex items-center gap-2">
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={isLoading}>
              <Download className="h-4 w-4 mr-2" /> CSV
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {kpis.map((k) => {
          const isGoodDelta = k.inverse ? k.delta < 0 : k.delta > 0;
          const isNeutral = k.delta === 0;
          const deltaColor = isNeutral
            ? 'text-muted-foreground'
            : isGoodDelta
            ? 'text-success'
            : 'text-destructive';
          const DeltaIcon = k.delta >= 0 ? ArrowUpRight : ArrowDownRight;
          return (
            <Card key={k.label} className="bg-card/50 backdrop-blur border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <k.icon className={`h-4 w-4 ${k.positive ? 'text-success' : 'text-muted-foreground'}`} />
                  {!isLoading && (
                    <div className={`flex items-center gap-0.5 text-[11px] font-medium ${deltaColor}`}>
                      <DeltaIcon className="h-3 w-3" />
                      {fmtDelta(k.delta, k.deltaUnit)}
                    </div>
                  )}
                </div>
                <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-20" /> : k.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-card/50 backdrop-blur border-primary/20">
        <CardHeader><CardTitle>Receita × Custo × Lucro (R$)</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v))} />
                <Legend />
                <Line type="monotone" dataKey="Receita" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Custo" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Lucro" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </NeonPageLayout>
  );
}
