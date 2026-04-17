import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThumbsUp, AlertTriangle, Lightbulb, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface CoachingTs {
  id: string;
  call_session_id: string;
  timestamp_seconds: number;
  feedback_type: 'positive' | 'improvement' | 'warning' | 'tip';
  message: string;
  severity: 'low' | 'medium' | 'high';
  category: string | null;
}

interface Props { callSessionId: string; onSeek?: (s: number) => void; }

const ICONS = {
  positive: ThumbsUp, improvement: AlertCircle, warning: AlertTriangle, tip: Lightbulb,
};
const COLORS = {
  positive: 'text-success border-success/40',
  improvement: 'text-warning border-warning/40',
  warning: 'text-destructive border-destructive/40',
  tip: 'text-primary border-primary/40',
};

function fmt(s: number) {
  const m = Math.floor(s / 60); const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export function CoachingTimeline({ callSessionId, onSeek }: Props) {
  const [items, setItems] = useState<CoachingTs[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('coaching_timestamps')
        .select('*').eq('call_session_id', callSessionId)
        .order('timestamp_seconds', { ascending: true });
      setItems((data ?? []) as unknown as CoachingTs[]);
    })();
  }, [callSessionId]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Coaching com Timestamps</h3>
        <Badge variant="outline">{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Nenhum feedback de coaching disponível.
        </p>
      ) : (
        <ScrollArea className="h-[280px] pr-4">
          <div className="space-y-2">
            {items.map((it) => {
              const Icon = ICONS[it.feedback_type];
              return (
                <div key={it.id} className={cn('border rounded-lg p-3 flex items-start gap-3', COLORS[it.feedback_type])}>
                  <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm">{it.message}</p>
                    {it.category && <p className="text-xs text-muted-foreground mt-1">{it.category}</p>}
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={() => onSeek?.(it.timestamp_seconds)}>
                    <Clock className="h-3 w-3" />{fmt(it.timestamp_seconds)}
                  </Button>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
}
