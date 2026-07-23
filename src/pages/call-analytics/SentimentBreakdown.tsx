import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type SentimentKey = 'positive' | 'neutral' | 'negative';

const SENTIMENT_META: Record<SentimentKey, { label: string; dot: string; text: string }> = {
  positive: { label: 'Positivo', dot: 'bg-success', text: 'text-success' },
  neutral: { label: 'Neutro', dot: 'bg-warning', text: 'text-warning' },
  negative: { label: 'Negativo', dot: 'bg-destructive', text: 'text-destructive' },
};

interface Props {
  counts: Record<SentimentKey, number>;
  summariesCount: number;
}

export function SentimentBreakdown({ counts, summariesCount }: Props) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Detalhes de Sentimento</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {(Object.keys(SENTIMENT_META) as SentimentKey[]).map((key) => {
          const meta = SENTIMENT_META[key];
          const pct = summariesCount > 0 ? Math.round((counts[key] / summariesCount) * 100) : 0;
          return (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${meta.dot}`} />
                <span className="text-sm">{meta.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{counts[key]}</span>
                <Badge variant="outline" className={meta.text}>{pct}%</Badge>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
