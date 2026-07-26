import { useCallback, useEffect, useState } from 'react';
import { Mic, MicOff, Send, X, Keyboard } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useVoiceCommand } from '@/hooks/useVoiceCommand';
import { VoiceAssistantOrb, VoiceWaveform } from './VoiceAssistantOrb';
import { parseVoiceIntent, describeIntent, type VoiceIntent } from './voice-intent';

interface VoiceAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIntent: (intent: VoiceIntent) => void;
}

const SUGGESTIONS = [
  'Ligar para 11 98765-4321',
  'Encerrar chamada',
  'Ativar mudo',
  'Repetir última chamada',
];

/** Modal em tela cheia do assistente de voz (com fallback por texto). */
export function VoiceAssistantDialog({ open, onOpenChange, onIntent }: VoiceAssistantDialogProps) {
  const { isListening, isProcessing, lastCommand, startListening, stopListening } = useVoiceCommand();
  const [textMode, setTextMode] = useState(false);
  const [draft, setDraft] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleIntent = useCallback(
    (text: string) => {
      const intent = parseVoiceIntent(text);
      setFeedback(describeIntent(intent));
      if (intent.action !== 'none') {
        onIntent(intent);
        onOpenChange(false);
      }
    },
    [onIntent, onOpenChange],
  );

  useEffect(() => {
    if (lastCommand?.command) handleIntent(lastCommand.command);
  }, [lastCommand, handleIntent]);

  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else void startListening();
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !textMode) {
        event.preventDefault();
        toggleListening();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, textMode, toggleListening]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border/60 bg-card/90 backdrop-blur-xl">
        <DialogTitle className="text-center text-lg font-semibold">Fale com o assistente</DialogTitle>
        <DialogDescription className="text-center text-sm">
          {textMode ? 'Digite o comando desejado' : 'Toque no orbe para começar'}
        </DialogDescription>

        <div className="flex flex-col items-center gap-6 py-4">
          <button
            type="button"
            onClick={toggleListening}
            aria-label={isListening ? 'Parar de ouvir' : 'Começar a ouvir'}
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <VoiceAssistantOrb active={isListening || isProcessing} />
          </button>
          <VoiceWaveform active={isListening} />

          {isProcessing ? <p className="text-sm text-muted-foreground">Processando…</p> : null}
          {feedback ? <p className="text-center text-sm text-foreground">{feedback}</p> : null}

          {textMode ? (
            <form
              className="flex w-full gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!draft.trim()) return;
                handleIntent(draft);
                setDraft('');
              }}
            >
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ex.: ligar para 11987654321"
                aria-label="Comando por texto"
              />
              <Button type="submit" size="icon" aria-label="Enviar comando">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <Badge
                  key={suggestion}
                  variant="outline"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleIntent(suggestion)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') handleIntent(suggestion);
                  }}
                  className="cursor-pointer text-xs"
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border/50 pt-3 text-[11px] text-muted-foreground">
          <span>
            <kbd className="rounded bg-muted px-1.5 py-0.5">ESC</kbd> fechar ·{' '}
            <kbd className="rounded bg-muted px-1.5 py-0.5">SPACE</kbd> ativar
          </span>
          <span className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={textMode ? 'Usar microfone' : 'Usar texto'}
              onClick={() => setTextMode((prev) => !prev)}
            >
              {textMode ? <Mic className="h-4 w-4" /> : <Keyboard className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Fechar assistente"
              onClick={() => onOpenChange(false)}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Button>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
