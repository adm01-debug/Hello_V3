import { useEffect, useMemo, useState } from 'react';
 import { Phone, MessageSquare, Brain, Download, Loader2, TrendingUp, TrendingDown, Minus, BarChart3, Sparkles, Lightbulb, Activity, PlayCircle, FileText, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { SessionWithSummary, Transcription, Analysis, CallSummary } from '@/hooks/useCallHistory';
import { TalkRatioChart } from '@/components/conversation-intelligence/TalkRatioChart';
import { KeyMomentsTimeline } from '@/components/conversation-intelligence/KeyMomentsTimeline';
import { CoachingTimeline } from '@/components/conversation-intelligence/CoachingTimeline';
import { LiveSentimentGraph } from '@/components/conversation-intelligence/LiveSentimentGraph';
import { CallPlayerWithTranscript, type PlayerMarker } from '@/components/conversation-intelligence/CallPlayerWithTranscript';
import { useTalkRatio } from '@/hooks/useTalkRatio';
import { useKeyMoments } from '@/hooks/useKeyMoments';
import { useLiveSentiment } from '@/hooks/useLiveSentiment';
import { MeetingSummaryCard } from '@/components/calls/MeetingSummaryCard';

const log = logger.create('CallDetailDialog');

interface Props {
  selectedSession: SessionWithSummary | null;
  onClose: () => void;
  isLoadingDetails: boolean;
  sessionTranscripts: Transcription[];
  sessionAnalyses: Analysis[];
  sessionSummary: CallSummary | null;
  onExportTranscript: () => void;
}

interface CoachingTs { id: string; timestamp_seconds: number; message: string; severity: string; }

const getSentimentBadge = (sentiment: string | null | undefined) => {
  if (!sentiment) return null;
  return (
    <Badge variant="outline" className={cn('text-xs',
      sentiment === 'positive' ? 'text-success border-success/50' :
      sentiment === 'negative' ? 'text-destructive border-destructive/50' : 'text-warning border-warning/50'
    )}>
      {sentiment === 'positive' ? <TrendingUp className="h-3 w-3 mr-1" /> :
       sentiment === 'negative' ? <TrendingDown className="h-3 w-3 mr-1" /> :
       <Minus className="h-3 w-3 mr-1" />}
      {sentiment === 'positive' ? 'Positivo' : sentiment === 'negative' ? 'Negativo' : 'Neutro'}
    </Badge>
  );
};

export function CallDetailDialog({ selectedSession, onClose, isLoadingDetails, sessionTranscripts, sessionAnalyses, sessionSummary, onExportTranscript }: Props) {
  const sessionId = selectedSession?.id;
  const { data: talkData, analyze, loading: talkLoading } = useTalkRatio();
  const { moments } = useKeyMoments(sessionId);
  const { snapshots } = useLiveSentiment(sessionId);

  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
   const [coachingTs, setCoachingTs] = useState<CoachingTs[]>([]);
   const [seekTo, setSeekTo] = useState<number | undefined>(undefined);
   const [activeTab, setActiveTab] = useState('player');
   const [transcriptSearch, setTranscriptSearch] = useState('');

  useEffect(() => {
    if (!sessionId) { setAudioUrl(undefined); setCoachingTs([]); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data: rec } = await supabase
          .from('call_recordings')
          .select('file_path')
          .eq('call_session_id', sessionId)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (rec?.file_path && !cancelled) {
          const { data: signed } = await supabase.storage.from('call-recordings').createSignedUrl(rec.file_path, 3600);
          if (!cancelled) setAudioUrl(signed?.signedUrl);
        }
        const { data: cts } = await supabase.from('coaching_timestamps')
          .select('id, timestamp_seconds, message, severity')
          .eq('call_session_id', sessionId)
          .order('timestamp_seconds', { ascending: true });
        if (!cancelled) setCoachingTs((cts ?? []) as unknown as CoachingTs[]);
      } catch (e) {
        log.warn('Falha ao carregar mídia/coaching', e);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

  const segments = useMemo(() => sessionTranscripts.map((t, idx) => ({
    speaker: (t.speaker === 'agent' ? 'agent' : 'customer') as 'agent' | 'customer',
    text: t.text,
    start: typeof t.start_time === 'number' ? t.start_time : idx * 5,
    end: typeof t.end_time === 'number' ? t.end_time : idx * 5 + 5,
  })), [sessionTranscripts]);

  const playerMarkers = useMemo<PlayerMarker[]>(() => [
    ...moments.map(m => ({ type: 'moment' as const, timestamp: m.timestamp_seconds, label: `${m.moment_type}: ${m.quote.slice(0, 60)}` })),
    ...coachingTs.map(c => ({ type: 'coaching' as const, timestamp: c.timestamp_seconds, label: c.message.slice(0, 60), severity: (c.severity as 'info' | 'warning' | 'critical') })),
  ], [moments, coachingTs]);

  const [analyzed, setAnalyzed] = useState<string | null>(null);
  useEffect(() => {
    if (!sessionId || segments.length === 0 || analyzed === sessionId) return;
    setAnalyzed(sessionId);
    void analyze(sessionId, segments, selectedSession?.duration_seconds ?? undefined);
  }, [sessionId, segments, analyze, selectedSession?.duration_seconds, analyzed]);

  const jumpTo = (ts: number) => {
    setSeekTo(ts);
    setActiveTab('player');
  };

  return (
    <Dialog open={!!selectedSession} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-5xl max-h-[88vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Phone className="h-5 w-5" /> Detalhes da Chamada</DialogTitle>
          <DialogDescription>
            {selectedSession && <span>{selectedSession.caller_name} • {format(new Date(selectedSession.started_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>}
          </DialogDescription>
        </DialogHeader>

        {isLoadingDetails ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="player" className="gap-2"><PlayCircle className="h-4 w-4" /> Player</TabsTrigger>
                <TabsTrigger value="ai-summary" className="gap-2"><FileText className="h-4 w-4" /> Resumo IA</TabsTrigger>
                <TabsTrigger value="transcription" className="gap-2"><MessageSquare className="h-4 w-4" /> Transcrição</TabsTrigger>
                <TabsTrigger value="analysis" className="gap-2"><Brain className="h-4 w-4" /> Análises</TabsTrigger>
                <TabsTrigger value="talk-ratio" className="gap-2"><BarChart3 className="h-4 w-4" /> Talk Ratio</TabsTrigger>
                <TabsTrigger value="key-moments" className="gap-2"><Sparkles className="h-4 w-4" /> Momentos</TabsTrigger>
                <TabsTrigger value="coaching" className="gap-2"><Lightbulb className="h-4 w-4" /> Coaching</TabsTrigger>
                <TabsTrigger value="sentiment" className="gap-2"><Activity className="h-4 w-4" /> Sentimento</TabsTrigger>
              </TabsList>
              {sessionTranscripts.length > 0 && (
                <Button variant="outline" size="sm" className="gap-2" onClick={onExportTranscript}><Download className="h-4 w-4" /> Exportar</Button>
              )}
            </div>

            {sessionSummary && (
              <Card className="mb-4 bg-primary/5 border-primary/20">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div><h4 className="font-medium text-sm text-primary mb-1">Resumo da Chamada</h4><p className="text-sm">{sessionSummary.summary}</p></div>
                      {getSentimentBadge(sessionSummary.overall_sentiment)}
                    </div>
                    {sessionSummary.main_topics && sessionSummary.main_topics.length > 0 && (
                      <div className="flex flex-wrap gap-1">{sessionSummary.main_topics.map((topic, i) => <Badge key={i} variant="secondary" className="text-xs">{topic}</Badge>)}</div>
                    )}
                    <div className="flex gap-6 text-sm">
                      {sessionSummary.customer_satisfaction && <div><span className="text-muted-foreground">Satisfação: </span><span className="font-medium">{sessionSummary.customer_satisfaction}/10</span></div>}
                      {sessionSummary.agent_performance_score && <div><span className="text-muted-foreground">Performance: </span><span className="font-medium">{sessionSummary.agent_performance_score}/10</span></div>}
                    </div>
                    {sessionSummary.next_steps && sessionSummary.next_steps.length > 0 && (
                      <div><span className="text-xs text-muted-foreground">Próximos passos:</span><ul className="list-disc list-inside text-sm mt-1">{sessionSummary.next_steps.map((step, i) => <li key={i}>{step}</li>)}</ul></div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <TabsContent value="player">
              <CallPlayerWithTranscript audioUrl={audioUrl} segments={segments} seekTo={seekTo} markers={playerMarkers} />
            </TabsContent>

            <TabsContent value="ai-summary">
              {sessionId && <MeetingSummaryCard callSessionId={sessionId} />}
            </TabsContent>

             <TabsContent value="transcription">
               <div className="space-y-4">
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                   <Input
                     placeholder="Buscar na transcrição..."
                     className="pl-9"
                     value={transcriptSearch}
                     onChange={(e) => setTranscriptSearch(e.target.value)}
                   />
                 </div>
                 <ScrollArea className="h-[350px] rounded-lg border border-border p-4">
                   {sessionTranscripts.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-12"><MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" /><p className="text-muted-foreground">Nenhuma transcrição disponível</p></div>
                   ) : (
                     <div className="space-y-4">
                       {sessionTranscripts
                         .filter(t => !transcriptSearch || t.text.toLowerCase().includes(transcriptSearch.toLowerCase()))
                         .map((t, idx) => {
                           const ts = typeof t.start_time === 'number' ? t.start_time : idx * 5;
                           return (
                             <div key={t.id} className={cn('flex gap-3', t.speaker === 'agent' ? 'justify-end' : 'justify-start')}>
                               <button
                                 type="button"
                                 onClick={() => jumpTo(ts)}
                                 className={cn('max-w-[75%] rounded-lg px-4 py-3 text-left transition-colors hover:ring-2 hover:ring-primary/50', t.speaker === 'agent' ? 'bg-primary/10 border border-primary/20' : 'bg-warning/10 border border-warning/20')}
                               >
                                 <div className="flex items-center gap-2 mb-1">
                                   <span className={cn('text-xs font-medium', t.speaker === 'agent' ? 'text-primary' : 'text-warning')}>{t.speaker === 'agent' ? 'Agente' : 'Cliente'}</span>
                                   <span className="text-xs text-muted-foreground">{format(new Date(t.created_at), 'HH:mm:ss')}</span>
                                 </div>
                                 <p className="text-sm">{t.text}</p>
                               </button>
                             </div>
                           );
                         })}
                       {sessionTranscripts.filter(t => !transcriptSearch || t.text.toLowerCase().includes(transcriptSearch.toLowerCase())).length === 0 && (
                         <div className="text-center py-8 text-muted-foreground">Nenhum resultado encontrado</div>
                       )}
                     </div>
                   )}
                 </ScrollArea>
               </div>
             </TabsContent>

            <TabsContent value="analysis">
              <ScrollArea className="h-[350px] rounded-lg border border-border p-4">
                {sessionAnalyses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12"><Brain className="h-12 w-12 text-muted-foreground/50 mb-4" /><p className="text-muted-foreground">Nenhuma análise disponível</p></div>
                ) : (
                  <div className="space-y-4">
                    {sessionAnalyses.map((a) => (
                      <div key={a.id} className="rounded-lg border border-border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn(a.sentiment === 'positive' ? 'text-success' : a.sentiment === 'negative' ? 'text-destructive' : 'text-warning')}>
                              {a.sentiment === 'positive' ? <TrendingUp className="h-3 w-3 mr-1" /> : a.sentiment === 'negative' ? <TrendingDown className="h-3 w-3 mr-1" /> : <Minus className="h-3 w-3 mr-1" />}{a.sentiment}
                            </Badge>
                            <Badge variant="secondary">{a.emotion}</Badge>
                            <Badge variant={a.urgency === 'high' ? 'destructive' : a.urgency === 'medium' ? 'default' : 'secondary'}>{a.urgency}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">{format(new Date(a.created_at), 'HH:mm:ss')}</span>
                        </div>
                        {a.message_analyzed && <p className="text-sm text-muted-foreground italic">"{a.message_analyzed}"</p>}
                        {a.suggestion && <div className="rounded-lg bg-primary/5 border border-primary/20 p-3"><p className="text-xs font-medium text-primary mb-1">Sugestão</p><p className="text-sm">{a.suggestion}</p></div>}
                        {a.risk_alert && <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3"><p className="text-xs font-medium text-destructive mb-1">Alerta de Risco</p><p className="text-sm">{a.risk_alert}</p></div>}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="talk-ratio">
              <TalkRatioChart data={talkData} loading={talkLoading} />
            </TabsContent>

            <TabsContent value="key-moments">
              <KeyMomentsTimeline moments={moments} onSeek={jumpTo} />
            </TabsContent>

            <TabsContent value="coaching">
              {sessionId && <CoachingTimeline callSessionId={sessionId} onSeek={jumpTo} />}
            </TabsContent>

            <TabsContent value="sentiment">
              <LiveSentimentGraph snapshots={snapshots} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
