import { useEffect, useState } from 'react';
import { Swords, X, Check, ThumbsUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { BattleCard } from '@/hooks/useBattleCardDetection';

const log = logger.create('BattleCardAlert');

interface Props {
  card: BattleCard | null;
  onDismiss: () => void;
  callSessionId?: string;
  agentName?: string;
  autoDismissMs?: number;
}

export function BattleCardAlert({ card, onDismiss, callSessionId, agentName, autoDismissMs = 30000 }: Props) {
  const [marked, setMarked] = useState(false);

  useEffect(() => {
    setMarked(false);
    if (!card || autoDismissMs <= 0) return;
    const t = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(t);
  }, [card, onDismiss, autoDismissMs]);

  const markAsUsed = async () => {
    if (!card || !callSessionId) { setMarked(true); return; }
    try {
      await supabase.from('coaching_timestamps').insert({
        call_session_id: callSessionId,
        agent_name: agentName || null,
        timestamp_seconds: 0,
        feedback_type: 'battle_card_used',
        category: 'competitive',
        severity: 'info',
        message: `Battle card "${card.competitor_name}" utilizado pelo agente.`,
      });
      setMarked(true);
      toast.success('Battle card marcado como usado');
    } catch (e) {
      log.error('Falha ao registrar uso', e);
      toast.error('Não foi possível registrar uso');
    }
  };

  if (!card) return null;

  return (
    <div
      className="fixed top-20 right-6 z-50 w-[380px] max-w-[92vw] animate-in slide-in-from-right-4 fade-in"
      role="dialog"
      aria-label={`Battle card para ${card.competitor_name}`}
    >
      <div className={cn(
        'rounded-xl border-2 border-warning/60 overflow-hidden',
        'bg-card/90 backdrop-blur-xl',
        'shadow-[0_0_50px_hsl(var(--warning)/0.45)]'
      )}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-warning/30 bg-warning/10">
          <div className="rounded-lg bg-warning/20 p-2 shadow-[0_0_15px_hsl(var(--warning)/0.5)]">
            <Swords className="h-4 w-4 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-warning font-bold">Concorrente detectado</p>
            <h4 className="text-sm font-bold text-foreground truncate">{card.competitor_name}</h4>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDismiss} aria-label="Fechar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {card.our_strengths.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-success mb-1.5 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" />Nossas vantagens
              </p>
              <ul className="space-y-1">
                {card.our_strengths.slice(0, 4).map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-sm">
                    <span className="text-success mt-1">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {card.talking_points.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-primary mb-1.5 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />Pontos a destacar
              </p>
              <ul className="space-y-1">
                {card.talking_points.slice(0, 4).map((s, i) => (
                  <li key={i} className="text-sm text-foreground/90">• {s}</li>
                ))}
              </ul>
            </section>
          )}

          {card.their_weaknesses.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-destructive mb-1.5">Fraquezas deles</p>
              <div className="flex flex-wrap gap-1">
                {card.their_weaknesses.slice(0, 4).map((s, i) => (
                  <Badge key={i} variant="outline" className="text-[11px] border-destructive/40 text-destructive">{s}</Badge>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="px-4 py-3 border-t border-border/40 bg-card/50 flex gap-2">
          <Button
            size="sm"
            variant={marked ? 'outline' : 'default'}
            onClick={markAsUsed}
            disabled={marked}
            className="flex-1"
          >
            <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
            {marked ? 'Registrado' : 'Marcar como usado'}
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss}>Fechar</Button>
        </div>
      </div>
    </div>
  );
}
