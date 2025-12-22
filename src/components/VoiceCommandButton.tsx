import React, { useCallback, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceCommand } from '@/hooks/useVoiceCommand';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VoiceCommand {
  action: 'call' | 'transfer' | 'hold' | 'hangup' | 'mute' | 'unmute' | 'unknown';
  target?: string;
  confidence: number;
}

interface VoiceCommandButtonProps {
  onCommand?: (command: VoiceCommand) => void;
  className?: string;
}

const actionLabels: Record<string, string> = {
  call: 'Ligar para',
  transfer: 'Transferir para',
  hold: 'Colocar em espera',
  hangup: 'Encerrar chamada',
  mute: 'Silenciar',
  unmute: 'Ativar áudio',
};

export function VoiceCommandButton({ onCommand, className }: VoiceCommandButtonProps) {
  const handleCommand = useCallback((command: VoiceCommand) => {
    const label = actionLabels[command.action] || 'Comando';
    const description = command.target 
      ? `${label} ${command.target}` 
      : label;

    toast({
      title: '🎤 Comando reconhecido',
      description,
    });

    onCommand?.(command);
  }, [onCommand]);

  const {
    isRecording,
    isProcessing,
    transcript,
    startRecording,
    stopRecording,
  } = useVoiceCommand(handleCommand);

  const handleMouseDown = useCallback(() => {
    if (!isProcessing) {
      startRecording();
    }
  }, [isProcessing, startRecording]);

  const handleMouseUp = useCallback(() => {
    if (isRecording) {
      stopRecording();
    }
  }, [isRecording, stopRecording]);

  // Handle keyboard shortcut (Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.ctrlKey && !isProcessing && !isRecording) {
        e.preventDefault();
        startRecording();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isRecording) {
        e.preventDefault();
        stopRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRecording, isProcessing, startRecording, stopRecording]);

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <Button
        variant={isRecording ? 'destructive' : 'default'}
        size="lg"
        className={cn(
          'relative h-16 w-16 rounded-full transition-all duration-200',
          isRecording && 'animate-pulse ring-4 ring-destructive/50',
          isProcessing && 'opacity-50 cursor-wait'
        )}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : isRecording ? (
          <MicOff className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </Button>

      <span className="text-sm text-muted-foreground">
        {isProcessing ? (
          'Processando...'
        ) : isRecording ? (
          'Solte para enviar'
        ) : (
          'Segure para falar'
        )}
      </span>

      {transcript && !isRecording && !isProcessing && (
        <p className="max-w-xs text-center text-sm text-muted-foreground italic">
          "{transcript}"
        </p>
      )}

      <span className="text-xs text-muted-foreground/60">
        Atalho: Ctrl + Espaço
      </span>
    </div>
  );
}
