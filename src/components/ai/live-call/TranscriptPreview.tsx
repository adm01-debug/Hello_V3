import { MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { TranscriptEntry } from './types';

export function TranscriptPreview({ transcripts }: { transcripts: TranscriptEntry[] }) {
  if (transcripts.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          Conversa
        </p>
        <div className="h-[120px] rounded-lg border border-border bg-accent/30 p-2 flex items-center justify-center">
          <p className="text-center text-xs text-muted-foreground">Aguardando transcrição...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        <MessageSquare className="h-3 w-3" />
        Transcrição Recente
      </p>
      <ScrollArea className="h-[120px] rounded-lg border border-border bg-accent/30 p-2">
        <div className="space-y-2">
          {transcripts.slice(-4).map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'rounded-lg p-2 text-xs',
                msg.speaker === 'agent'
                  ? 'bg-primary/10 text-primary ml-4'
                  : 'bg-warning/10 text-warning mr-4',
              )}
            >
              <span className="font-medium">
                {msg.speaker === 'agent' ? 'Agente:' : 'Cliente:'}
              </span>{' '}
              {msg.text}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
