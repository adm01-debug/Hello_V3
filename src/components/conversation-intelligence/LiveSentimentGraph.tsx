import { Card } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { Activity } from 'lucide-react';
import type { SentimentSnapshot } from '@/hooks/useLiveSentiment';

interface Props { snapshots: SentimentSnapshot[]; }

function sentimentToValue(s: string) {
  switch (s) {
    case 'positive': return 1;
    case 'neutral': return 0;
    case 'mixed': return -0.3;
    case 'negative': return -1;
    default: return 0;
  }
}

export function LiveSentimentGraph({ snapshots }: Props) {
  const data = snapshots.map((s) => ({
    t: Math.round(s.timestamp_seconds),
    value: typeof s.score === 'number' ? s.score : sentimentToValue(s.sentiment),
    sentiment: s.sentiment,
  }));

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Sentimento ao Vivo</h3>
      </div>
      {data.length < 2 ? (
        <p className="text-xs text-muted-foreground text-center py-8">Aguardando dados de sentimento…</p>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="t" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis domain={[-1, 1]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
              formatter={(v: number) => [v.toFixed(2), 'Score']}
              labelFormatter={(l: number) => `${l}s`}
            />
            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            <Line
              type="monotone" dataKey="value"
              stroke="hsl(var(--primary))" strokeWidth={2}
              dot={{ r: 2 }} activeDot={{ r: 4 }} isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
