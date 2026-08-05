import { FileText, Headphones, Loader2, Mic, MicOff, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { SpeakerStats } from './types';

interface Props {
  isRecording: boolean;
  isProcessing: boolean;
  speakerStats: SpeakerStats;
  onStart: () => void;
  onStop: () => void;
}

export function TranscriptionHeader({ isRecording, isProcessing, speakerStats, onStart, onStop }: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Transcrição ao Vivo</span>
        {isRecording && (
          <Badge variant="outline" className="gap-1 text-xs">
            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            Gravando
          </Badge>
        )}
        {isProcessing && (
          <Badge variant="outline" className="gap-1 text-xs">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processando
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Headphones className="h-3 w-3 text-primary" />
          <span>Agente: {speakerStats.agent}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <User className="h-3 w-3 text-warning" />
          <span>Cliente: {speakerStats.customer}</span>
        </div>
        <Button
          variant={isRecording ? 'destructive' : 'default'}
          size="sm"
          onClick={isRecording ? onStop : onStart}
          className="gap-1"
        >
          {isRecording ? (<><MicOff className="h-3 w-3" />Parar</>) : (<><Mic className="h-3 w-3" />Iniciar</>)}
        </Button>
      </div>
    </div>
  );
}
