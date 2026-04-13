import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AgentStats, PerformanceDataPoint, AGENT_COLORS } from '@/hooks/useAgentRanking';

interface Props {
  performanceData: PerformanceDataPoint[];
  agents: AgentStats[];
}

export function PerformanceEvolutionChart({ performanceData, agents }: Props) {
  if (performanceData.length === 0 || agents.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Evolução de Performance (Últimos 7 dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis domain={[0, 10]} className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: 'Performance', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{
                backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))',
                borderRadius: '8px', color: 'hsl(var(--popover-foreground))'
              }} />
              <Legend />
              {agents.slice(0, 8).map((agent, index) => (
                <Line key={agent.name} type="monotone" dataKey={agent.name}
                  stroke={AGENT_COLORS[index % AGENT_COLORS.length]} strokeWidth={2}
                  dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
