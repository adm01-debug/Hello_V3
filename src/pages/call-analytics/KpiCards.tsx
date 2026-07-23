import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatDuration } from '@/lib/utils';
import { Clock, Phone, Star, Users } from 'lucide-react';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  icon: ReactNode;
  value: string | number;
  footer?: ReactNode;
}

function StatCard({ title, icon, value, footer }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {footer}
      </CardContent>
    </Card>
  );
}

interface Props {
  totalCalls: number;
  summariesCount: number;
  avgDuration: number;
  avgSatisfaction: number;
  avgPerformance: number;
}

export function KpiCards({ totalCalls, summariesCount, avgDuration, avgSatisfaction, avgPerformance }: Props) {
  const iconCls = 'h-4 w-4 text-muted-foreground';
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total de Chamadas"
        icon={<Phone className={iconCls} />}
        value={totalCalls}
        footer={<p className="text-xs text-muted-foreground">{summariesCount} com resumo IA</p>}
      />
      <StatCard
        title="Duração Média"
        icon={<Clock className={iconCls} />}
        value={formatDuration(avgDuration)}
        footer={<p className="text-xs text-muted-foreground">por chamada</p>}
      />
      <StatCard
        title="Satisfação Média"
        icon={<Star className={iconCls} />}
        value={`${avgSatisfaction.toFixed(1)}/10`}
        footer={<Progress value={avgSatisfaction * 10} className="mt-2" />}
      />
      <StatCard
        title="Performance Agentes"
        icon={<Users className={iconCls} />}
        value={`${avgPerformance.toFixed(1)}/10`}
        footer={<Progress value={avgPerformance * 10} className="mt-2" />}
      />
    </div>
  );
}
