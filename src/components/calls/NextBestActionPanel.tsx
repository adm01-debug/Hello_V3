import { useMemo } from 'react';
import { Sparkles, AlertTriangle, ShieldAlert, MessageSquare, ThumbsUp, X, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useLiveAssist, type LiveAssistSignal } from '@/hooks/useLiveAssist';
import { rankSignals, dedupeSignals, INTENT_LABELS } from '@/lib/agent-assist-utils';

interface NextBestActionPanelProps {
  callSessionId: string;
  agentName?: string;
  className?: string;
}

const ICONS: Record<string, React.ElementType> = {
  compliance_violation: ShieldAlert,
  churn_risk: AlertTriangle,
  objection: MessageSquare,
  buying_signal: ThumbsUp,
  discount_request: AlertTriangle,
  technical_question: MessageSquare,
  sentiment_alert: AlertTriangle,
};

function severityClasses(intent: string, severity?: string) {
  if (intent === 'compliance_violation' || severity === 'critical' || intent === 'churn_risk') {
    return 'border-destructive/40 bg-destructive/5 text-destructive';
  }
  if (intent === 'buying_signal') {
    return 'border-success/40 bg-success/5 text-success';
  }
  if (intent === 'objection' || intent === 'discount_request' || severity === 'warning') {
    return 'border-warning/40 bg-warning/5 text-warning';
  }
  return 'border-primary/30 bg-primary/5 text-primary';
}

export function NextBestActionPanel({ callSessionId, className }: NextBestActionPanelProps) {
  const { signals, markUsed, isAnalyzing } = useLiveAssist(callSessionId);

   const ranked = useMemo(() => rankSignals(dedupeSignals(signals, 30) as LiveAssistSignal[]).slice(0, 6) as LiveAssistSignal[], [signals]);

  if (!callSessionId) return null;

  return (
    <Card className={cn('p-3 bg-card/60 backdrop-blur border-primary/20', className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className={cn('h-4 w-4 text-primary', isAnalyzing && 'animate-pulse')} />
          <span className="text-sm font-semibold">Next-Best-Action</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {ranked.length} sinal{ranked.length === 1 ? '' : 's'}
        </Badge>
      </div>

      {ranked.length === 0 ? (
        <p className="text-xs text-muted-foreground py-3 text-center">
          Aguardando análise da conversa...
        </p>
      ) : (
        <ScrollArea className="h-44 pr-2">
          <div className="space-y-2">
            {ranked.map((s: LiveAssistSignal) => {
              const Icon = ICONS[s.intent] ?? Sparkles;
              const sev = (s.metadata as Record<string, unknown>)?.severity as string | undefined;
              return (
                <div
                  key={s.id}
                  className={cn(
                    'rounded-md border p-2 text-xs space-y-1 transition',
                    severityClasses(s.intent, sev),
                    s.was_used && 'opacity-50'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1 font-medium">
                      <Icon className="h-3 w-3" />
                      <span>{INTENT_LABELS[s.intent] ?? s.intent}</span>
                      <Badge variant="outline" className="text-[10px] ml-1 px-1 py-0">
                        {Math.round((s.confidence ?? 0) * 100)}%
                      </Badge>
                    </div>
                    {!s.was_used && (
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          title="Usei essa sugestão"
                          onClick={() => markUsed(s.id)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          title="Ignorar"
                          onClick={() => markUsed(s.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {s.suggestion && (
                    <p className="text-foreground/90 leading-snug">{s.suggestion}</p>
                  )}
                  {s.trigger_text && (
                    <p className="text-[10px] italic text-muted-foreground line-clamp-2">
                      "{s.trigger_text}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
}
