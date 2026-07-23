import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { chartTooltipStyle } from './chart-utils';

interface Props {
  data: Array<{ name: string; value: number; color: string }>;
}

export function SentimentPieChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Distribuição de Sentimento</CardTitle>
        <CardDescription>Análise geral das chamadas</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {data.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            Sem dados de sentimento disponíveis
          </div>
        )}
      </CardContent>
    </Card>
  );
}
