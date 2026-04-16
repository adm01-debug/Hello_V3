import { useEffect } from 'react';
import { Swords, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { BattleCard } from '@/hooks/useBattleCardDetection';

interface Props {
  card: BattleCard | null;
  onDismiss: () => void;
}

export function BattleCardAlert({ card, onDismiss }: Props) {
  useEffect(() => {
    if (!card) return;
    const t = setTimeout(onDismiss, 25000);
    return () => clearTimeout(t);
  }, [card, onDismiss]);

  if (!card) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[92vw] animate-in slide-in-from-bottom-4 fade-in">
      <Card className={cn(
        'p-4 border-2 border-warning/60 shadow-2xl',
        'bg-card/95 backdrop-blur-md',
        'shadow-[0_0_30px_hsl(var(--warning)/0.4)]'
      )}>
        <div className="flex items-start gap-3 mb-3">
          <div className="rounded-lg bg-warning/20 p-2">
            <Swords className="h-5 w-5 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-warning font-bold">Concorrente detectado</p>
            <h4 className="text-base font-bold text-foreground truncate">{card.competitor_name}</h4>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1" onClick={onDismiss} aria-label="Fechar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {card.our_strengths.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-success mb-1.5">Nossas vantagens</p>
            <ul className="space-y-1">
              {card.our_strengths.slice(0, 3).map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-sm">
                  <Check className="h-3.5 w-3.5 text-success mt-0.5 flex-shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {card.talking_points.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-primary mb-1.5">Pontos a destacar</p>
            <ul className="space-y-1">
              {card.talking_points.slice(0, 3).map((s, i) => (
                <li key={i} className="text-sm text-foreground/90">• {s}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
