import { AlertTriangle, Lightbulb, Meh, Minus, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  emotionIcons,
  getSentimentColor,
  getUrgencyColor,
  type RealtimeInsight,
} from './types';

export function RiskAlert({ insight }: { insight: RealtimeInsight }) {
  if (!insight.riskAlert) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 animate-pulse">
      <AlertTriangle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
      <div>
        <p className="text-sm font-medium text-destructive">Alerta de Risco</p>
        <p className="text-xs text-destructive/80">{insight.riskReason}</p>
      </div>
    </div>
  );
}

export function LatestInsightPanel({ insight }: { insight: RealtimeInsight }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className={cn('gap-1', getSentimentColor(insight.sentiment))}>
          {insight.sentiment === 'positive' ? (
            <TrendingUp className="h-3 w-3" />
          ) : insight.sentiment === 'negative' ? (
            <TrendingDown className="h-3 w-3" />
          ) : (
            <Minus className="h-3 w-3" />
          )}
          {insight.sentiment}
        </Badge>

        <Badge variant="outline" className="gap-1">
          {emotionIcons[insight.emotion] || <Meh className="h-3 w-3" />}
          {insight.emotion}
        </Badge>

        <Badge className={cn('gap-1', getUrgencyColor(insight.urgency))}>
          <Zap className="h-3 w-3" />
          {insight.urgency}
        </Badge>
      </div>

      {insight.suggestion && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <div>
              <p className="text-xs font-medium text-primary">Sugestão</p>
              <p className="text-sm text-foreground">{insight.suggestion}</p>
            </div>
          </div>
        </div>
      )}

      {insight.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {insight.keywords.map((keyword, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {keyword}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
