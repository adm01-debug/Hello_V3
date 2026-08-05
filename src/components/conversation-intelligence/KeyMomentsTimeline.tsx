import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DollarSign, Swords, ShieldAlert, ArrowRight, Handshake, TrendingDown, HelpCircle, Sparkles, Clock } from 'lucide-react';
import type { KeyMoment } from '@/hooks/useKeyMoments';
import { cn } from '@/lib/utils';

interface Props {
  moments: KeyMoment[];
  onSeek?: (seconds: number) => void;
  loading?: boolean;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  price: DollarSign,
  competitor: Swords,
  objection: ShieldAlert,
  next_step: ArrowRight,
  commitment: Handshake,
  churn_risk: TrendingDown,
  question: HelpCircle,
  positive: Sparkles,
};

const LABELS: Record<string, string> = {
  price: 'Preço',
  competitor: 'Concorrente',
  objection: 'Objeção',
  next_step: 'Próximo passo',
  commitment: 'Compromisso',
  churn_risk: 'Risco churn',
  question: 'Pergunta',
  positive: 'Positivo',
};

const COLORS: Record<string, string> = {
  price: 'text-success border-success/40 bg-success/10',
  competitor: 'text-warning border-warning/40 bg-warning/10',
  objection: 'text-destructive border-destructive/40 bg-destructive/10',
  next_step: 'text-primary border-primary/40 bg-primary/10',
  commitment: 'text-success border-success/40 bg-success/10',
  churn_risk: 'text-destructive border-destructive/40 bg-destructive/10',
  question: 'text-muted-foreground border-border bg-muted/40',
  positive: 'text-primary border-primary/40 bg-primary/10',
};

function fmt(s: number) {
  const m = Math.floor(s / 60); const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export function KeyMomentsTimeline({ moments, onSeek, loading }: Props) {
  if (loading) return <Card className="p-6 animate-pulse h-48" />;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Momentos-chave</h3>
        <Badge variant="outline">{moments.length}</Badge>
      </div>

      {moments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Nenhum momento-chave detectado ainda.
        </p>
      ) : (
        <ScrollArea className="h-[320px] pr-4">
          <div className="space-y-3">
            {moments.map((m) => {
              const Icon = ICONS[m.moment_type] ?? Sparkles;
              const colorCls = COLORS[m.moment_type] ?? 'border-border';
              return (
                <div
                  key={m.id}
                  className={cn(
                    'border rounded-lg p-3 transition-all hover:shadow-md cursor-pointer',
                    colorCls
                  )}
                  onClick={() => onSeek?.(m.timestamp_seconds)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') onSeek?.(m.timestamp_seconds); }}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wide">{LABELS[m.moment_type] ?? m.moment_type}</span>
                        <Button
                          variant="ghost" size="sm"
                          className="h-5 px-1.5 text-xs gap-1 ml-auto"
                          onClick={(e) => { e.stopPropagation(); onSeek?.(m.timestamp_seconds); }}
                        >
                          <Clock className="h-3 w-3" />
                          {fmt(m.timestamp_seconds)}
                        </Button>
                      </div>
                      <p className="text-sm text-foreground/90 italic">"{m.quote}"</p>
                      {m.speaker && (
                        <p className="text-xs text-muted-foreground mt-1">— {m.speaker === 'agent' ? 'Agente' : 'Cliente'}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
}
