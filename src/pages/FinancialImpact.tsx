import { DollarSign, TrendingUp, TrendingDown, Phone, Trophy } from 'lucide-react';
import { NeonPageLayout } from '@/components/layout/NeonPageLayout';
import { NeonPageHeader } from '@/components/layout/NeonPageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useFinancialImpact } from '@/hooks/useFinancialImpact';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const brl = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

export default function FinancialImpact() {
  usePageTitle('Impacto Financeiro');
  const [days, setDays] = useState<number>(30);
  const { data, isLoading } = useFinancialImpact(days);

  const kpis = [
    { label: 'Receita', value: brl(data?.summary.total_revenue_cents ?? 0), icon: DollarSign, positive: true },
    { label: 'Custo estimado', value: brl(data?.summary.total_cost_cents ?? 0), icon: Phone, positive: false },
    { label: 'Lucro', value: brl(data?.summary.total_profit_cents ?? 0), icon: (data?.summary.total_profit_cents ?? 0) >= 0 ? TrendingUp : TrendingDown, positive: (data?.summary.total_profit_cents ?? 0) >= 0 },
    { label: 'ROI', value: `${data?.summary.roi_percent ?? 0}%`, icon: TrendingUp, positive: (data?.summary.roi_percent ?? 0) >= 0 },
    { label: 'Deals ganhos', value: String(data?.summary.total_deals_won ?? 0), icon: Trophy, positive: true },
    { label: 'CAC / deal', value: brl(data?.summary.cac_cents ?? 0), icon: DollarSign, positive: false },
  ];

  const chartData = (data?.series ?? []).map((d) => ({
    day: new Date(d.day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    Receita: d.revenue_cents / 100,
    Custo: d.estimated_cost_cents / 100,
    Lucro: d.profit_cents / 100,
  }));

  return (
    <NeonPageLayout>
      <NeonPageHeader
        title="Impacto Financeiro"
        description="Custo por chamada × receita por deal"
        icon={<DollarSign />}
        actions={
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {kpis.map((k) => (
          <Card key={k.label} className="bg-card/50 backdrop-blur border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <k.icon className={`h-4 w-4 ${k.positive ? 'text-success' : 'text-muted-foreground'}`} />
              </div>
              <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-20" /> : k.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
            </CardContent>
          </Card>
        ))}
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
