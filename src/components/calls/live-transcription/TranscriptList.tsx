import { forwardRef } from 'react';
import { Headphones, User, Volume2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { TranscriptEntry } from './types';

interface Props {
  transcripts: TranscriptEntry[];
  isRecording: boolean;
}

export const TranscriptList = forwardRef<HTMLDivElement, Props>(({ transcripts, isRecording }, ref) => {
  return (
    <ScrollArea className="h-[180px]" ref={ref}>
      <div className="p-4 space-y-3">
        {transcripts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Volume2 className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              {isRecording
                ? 'Aguardando fala... A identificação de falantes será feita automaticamente.'
                : 'Clique em Iniciar para começar a transcrição'}
            </p>
          </div>
        ) : (
          transcripts.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                'flex gap-3 animate-fade-in',
                entry.speaker === 'agent' ? 'justify-end' : 'justify-start',
              )}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-lg px-3 py-2',
                  entry.speaker === 'agent'
                    ? 'bg-primary/10 border border-primary/20'
                    : 'bg-warning/10 border border-warning/20',
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  {entry.speaker === 'agent' ? (
                    <Headphones className="h-3 w-3 text-primary" />
                  ) : (
                    <User className="h-3 w-3 text-warning" />
                  )}
                  <span className={cn(
                    'text-xs font-medium',
                    entry.speaker === 'agent' ? 'text-primary' : 'text-warning',
                  )}>
                    {entry.speaker === 'agent' ? 'Agente' : 'Cliente'}
                  </span>
                </div>
                <p className="text-sm">{entry.text}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {entry.timestamp.toLocaleTimeString('pt-BR', {
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
});

TranscriptList.displayName = 'TranscriptList';
