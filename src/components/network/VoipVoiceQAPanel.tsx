import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Mic, MicOff, Send, Sparkles, Loader2, History } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { useVoipDiagnosticVoiceQA, type VoiceQAResult } from '@/hooks/useVoipDiagnosticVoiceQA';

const log = logger.create('VoipVoiceQAPanel');
const HISTORY_KEY = 'voip-voiceqa-history';
const MAX_HISTORY = 5;

const SUGGESTIONS = [
  'Por que o MOS caiu hoje?',
  'Quais agentes estão mais afetados?',
  'O que devo aplicar primeiro?',
  'Qual o impacto dos alertas críticos?',
];

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface HistoryItem { question: string; answer: string; at: string }

export const VoipVoiceQAPanel = () => {
  const [question, setQuestion] = useState('');
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState<VoiceQAResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const qa = useVoipDiagnosticVoiceQA();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch (e) { log.warn('Falha ao carregar histórico', e); }
  }, []);

  const saveHistory = (item: HistoryItem) => {
    const next = [item, ...history].slice(0, MAX_HISTORY);
    setHistory(next);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch (e) { log.warn('Falha ao salvar histórico', e); }
  };

  const ask = async (q: string) => {
    if (q.trim().length < 5) {
      toast.warning('Pergunta muito curta', { description: 'Use pelo menos 5 caracteres.' });
      return;
    }
    try {
      const r = await qa.mutateAsync({ question: q.trim(), period: 'week' });
      setResult(r);
      saveHistory({ question: q.trim(), answer: r.answer, at: new Date().toISOString() });
      setQuestion('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Falha ao consultar IA', { description: msg });
    }
  };

  const toggleMic = () => {
    const SR = getSpeechRecognition();
    if (!SR) {
      toast.info('Reconhecimento de voz indisponível', { description: 'Use o campo de texto.' });
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'pt-BR';
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? '';
      setQuestion(transcript);
      if (transcript.length >= 5) void ask(transcript);
    };
    rec.onerror = () => { setListening(false); toast.error('Erro no microfone'); };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  const onCitationClick = (ref?: string) => {
    if (!ref) return;
    const el = document.querySelector(ref);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Card className="glass-card border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Pergunte ao Diagnóstico VoIP
        </CardTitle>
        <CardDescription>
          Análise conversacional com IA sobre os últimos 7 dias. Use voz ou texto.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ex.: Por que o MOS caiu hoje?"
            onKeyDown={(e) => { if (e.key === 'Enter' && !qa.isPending) void ask(question); }}
            disabled={qa.isPending}
            className="bg-background/60"
            maxLength={500}
          />
          <Button
            type="button"
            size="icon"
            variant={listening ? 'default' : 'outline'}
            onClick={toggleMic}
            disabled={qa.isPending}
            aria-label={listening ? 'Parar microfone' : 'Ativar microfone'}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button onClick={() => void ask(question)} disabled={qa.isPending || question.trim().length < 5}>
            {qa.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map(s => (
            <Button key={s} type="button" variant="outline" size="sm" onClick={() => void ask(s)} disabled={qa.isPending} className="text-xs">
              {s}
            </Button>
          ))}
        </div>

        {result && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs uppercase">
                Confiança: {result.confidence}
              </Badge>
              <span className="text-[10px] text-muted-foreground font-mono">
                {result.contextSize} eventos analisados
              </span>
            </div>
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown>{result.answer}</ReactMarkdown>
            </div>
            {result.citations.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/40">
                <span className="text-[10px] uppercase text-muted-foreground self-center">Fontes:</span>
                {result.citations.map((c, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className={cn('text-[10px]', c.ref && 'cursor-pointer hover:bg-primary/20')}
                    onClick={() => onCitationClick(c.ref)}
                  >
                    {c.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {history.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs uppercase text-muted-foreground">
              <History className="h-3 w-3" /> Últimas perguntas
            </div>
            <ScrollArea className="max-h-40">
              <div className="space-y-1.5 pr-3">
                {history.map((h, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => void ask(h.question)}
                    className="w-full text-left text-xs p-2 rounded border border-border/40 hover:bg-muted/40 transition-colors"
                  >
                    <div className="font-medium truncate">{h.question}</div>
                    <div className="text-muted-foreground truncate text-[10px]">{h.answer.slice(0, 80)}…</div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
