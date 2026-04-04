import { BarChart3, Star, Pause, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { CallsByDay, SatisfactionTrend, SentimentData, TopAgent, HoldByAgent } from '@/hooks/useExecutiveDashboard';

const COLORS = [
  'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
  'hsl(var(--chart-4))', 'hsl(var(--chart-5))',
];

const tooltipStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
};

const axisTickStyle = { fill: 'hsl(var(--muted-foreground))' };

export function CallsVolumeChart({ data }: { data: CallsByDay[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Volume de Chamadas (7 dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={axisTickStyle} />
              <YAxis tick={axisTickStyle} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Area type="monotone" dataKey="calls" name="Total" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.3} />
              <Area type="monotone" dataKey="completed" name="Concluídas" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function SatisfactionChart({ data }: { data: SatisfactionTrend[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Tendência de Satisfação e Performance (7 dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={axisTickStyle} />
              <YAxis domain={[0, 10]} tick={axisTickStyle} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Area type="monotone" dataKey="satisfaction" name="Satisfação" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.3} />
              <Area type="monotone" dataKey="performance" name="Performance" stroke="hsl(var(--chart-4))" fill="hsl(var(--chart-4))" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function SentimentChart({ data }: { data: SentimentData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição de Sentimentos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={((props: Record<string, unknown>) =>
                  `${String(props.name ?? '')} ${((Number(props.percent ?? 0)) * 100).toFixed(0)}%`
                ) as never}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function HoldByAgentChart({ data }: { data: HoldByAgent[] }) {
  if (data.length === 0) return null;
  return (
    <Card className="border-call-hold/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pause className="h-5 w-5 text-call-hold" />
          Tempo em Espera por Agente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tick={axisTickStyle} />
              <YAxis type="category" dataKey="name" width={120} tick={axisTickStyle} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={((value: number, name: string) => {
                  if (name === 'Tempo Total' || name === 'Média') {
                    const mins = Math.floor(value / 60);
                    const secs = Math.round(value % 60);
                    return [`${mins}m ${secs}s`, name] as [string, string];
                  }
                  return [value, name] as [number, string];
                }) as never}
              />
              <Legend />
              <Bar dataKey="holdTime" name="Tempo Total" fill="hsl(24, 100%, 50%)" />
              <Bar dataKey="holdCount" name="Eventos" fill="hsl(24, 80%, 65%)" />
              <Bar dataKey="avgHoldTime" name="Média" fill="hsl(24, 60%, 75%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function TopAgentsChart({ data }: { data: TopAgent[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Top 5 Agentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tick={axisTickStyle} />
              <YAxis type="category" dataKey="name" width={120} tick={axisTickStyle} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Bar dataKey="calls" name="Chamadas" fill="hsl(var(--chart-1))" />
              <Bar dataKey="satisfaction" name="Satisfação" fill="hsl(var(--chart-2))" />
              <Bar dataKey="performance" name="Performance" fill="hsl(var(--chart-3))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
