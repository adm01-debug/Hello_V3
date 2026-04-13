import { Phone, MessageSquare, Brain, Download, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SessionWithSummary, Transcription, Analysis, CallSummary } from '@/hooks/useCallHistory';

interface Props {
  selectedSession: SessionWithSummary | null;
  onClose: () => void;
  isLoadingDetails: boolean;
  sessionTranscripts: Transcription[];
  sessionAnalyses: Analysis[];
  sessionSummary: CallSummary | null;
  onExportTranscript: () => void;
}

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
  return (
    <Dialog open={!!selectedSession} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Phone className="h-5 w-5" /> Detalhes da Chamada</DialogTitle>
          <DialogDescription>
            {selectedSession && <span>{selectedSession.caller_name} • {format(new Date(selectedSession.started_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>}
          </DialogDescription>
        </DialogHeader>

        {isLoadingDetails ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <Tabs defaultValue="transcription" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="transcription" className="gap-2"><MessageSquare className="h-4 w-4" /> Transcrição ({sessionTranscripts.length})</TabsTrigger>
                <TabsTrigger value="analysis" className="gap-2"><Brain className="h-4 w-4" /> Análises ({sessionAnalyses.length})</TabsTrigger>
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

            <TabsContent value="transcription">
              <ScrollArea className="h-[350px] rounded-lg border border-border p-4">
                {sessionTranscripts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12"><MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" /><p className="text-muted-foreground">Nenhuma transcrição disponível</p></div>
                ) : (
                  <div className="space-y-4">
                    {sessionTranscripts.map((t) => (
                      <div key={t.id} className={cn('flex gap-3', t.speaker === 'agent' ? 'justify-end' : 'justify-start')}>
                        <div className={cn('max-w-[75%] rounded-lg px-4 py-3', t.speaker === 'agent' ? 'bg-primary/10 border border-primary/20' : 'bg-warning/10 border border-warning/20')}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn('text-xs font-medium', t.speaker === 'agent' ? 'text-primary' : 'text-warning')}>{t.speaker === 'agent' ? 'Agente' : 'Cliente'}</span>
                            <span className="text-xs text-muted-foreground">{format(new Date(t.created_at), 'HH:mm:ss')}</span>
                          </div>
                          <p className="text-sm">{t.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
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
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
