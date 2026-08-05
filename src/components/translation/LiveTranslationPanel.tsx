import { useState } from 'react';
import { Languages, Sparkles, Loader2, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLiveTranslation } from '@/hooks/useLiveTranslation';
import { useCulturalHints } from '@/hooks/useCulturalHints';
import { SUPPORTED_LANGS, langFlag, langLabel, type SupportedLang } from '@/lib/language-detection';
import { cn } from '@/lib/utils';

interface Props {
  callSessionId?: string;
  onTranslate?: (translateFn: (text: string, speaker: 'agent' | 'customer') => void) => void;
}

export function LiveTranslationPanel({ callSessionId, onTranslate }: Props) {
  const [target, setTarget] = useState<SupportedLang>('en');
  const [manualText, setManualText] = useState('');
  const [speaker, setSpeaker] = useState<'agent' | 'customer'>('customer');
  const { segments, isTranslating, translate, reset } = useLiveTranslation({ callSessionId, targetLang: target });
  const { hints } = useCulturalHints(target);

  // Expor callback para o pai integrar com transcrição ao vivo
  if (onTranslate) onTranslate(translate);

  const handleManual = async () => {
    if (!manualText.trim()) return;
    await translate(manualText.trim(), speaker);
    setManualText('');
  };

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Languages className="h-4 w-4 text-primary" />
          Tradução em Tempo Real
          {isTranslating && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Select value={target} onValueChange={(v) => setTarget(v as SupportedLang)}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGS.map((l) => (
                <SelectItem key={l.code} value={l.code}>{l.flag} {l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={speaker} onValueChange={(v) => setSpeaker(v as 'agent' | 'customer')}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer">Cliente</SelectItem>
              <SelectItem value="agent">Agente</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={reset} className="ml-auto h-8">Limpar</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {hints.length > 0 && (
          <Alert className="border-primary/30 bg-primary/5">
            <Sparkles className="h-3 w-3" />
            <AlertDescription className="text-xs space-y-1">
              {hints.slice(0, 2).map((h) => (
                <div key={h.id} className="flex items-start gap-1">
                  <Badge variant={h.severity === 'critical' ? 'destructive' : h.severity === 'warning' ? 'default' : 'secondary'} className="text-[10px] uppercase">{h.context_type}</Badge>
                  <span>{h.hint_text}</span>
                </div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManual()}
            placeholder={`Digite texto para traduzir → ${langLabel(target)}`}
            className="flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={!callSessionId}
          />
          <Button size="sm" onClick={handleManual} disabled={!callSessionId || isTranslating || !manualText.trim()}>
            <ArrowRightLeft className="h-3 w-3" />
          </Button>
        </div>

        <ScrollArea className="h-48 rounded border bg-background/40 p-2">
          {segments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              Aguardando fala para tradução automática...
            </p>
          ) : (
            <div className="space-y-2">
              {segments.slice(-20).map((s) => (
                <div key={s.id} className={cn(
                  'rounded-md border p-2 text-xs',
                  s.speaker === 'agent' ? 'border-primary/30 bg-primary/5' : 'border-success/30 bg-success/5',
                )}>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1">
                    <span className="font-medium uppercase">{s.speaker === 'agent' ? 'Agente' : 'Cliente'}</span>
                    <span>{langFlag(s.sourceLang)} → {langFlag(s.targetLang)}</span>
                    {s.latencyMs && <span>· {s.latencyMs}ms</span>}
                  </div>
                  <p className="text-muted-foreground italic">{s.original}</p>
                  <p className="font-medium mt-1">{s.translated}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
