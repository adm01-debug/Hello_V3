import { useState, useEffect } from 'react';
import { 
  Phone, 
  Clock, 
  Calendar, 
  User, 
  MessageSquare, 
  Brain, 
  ChevronRight,
  Search,
  Filter,
  Download,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CallSession {
  id: string;
  caller_name: string | null;
  caller_phone: string | null;
  agent_name: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  status: string | null;
}

interface Transcription {
  id: string;
  speaker: string;
  text: string;
  start_time: number | null;
  end_time: number | null;
  created_at: string;
}

interface Analysis {
  id: string;
  sentiment: string | null;
  urgency: string | null;
  emotion: string | null;
  suggestion: string | null;
  risk_alert: string | null;
  message_analyzed: string | null;
  speaker_role: string | null;
  created_at: string;
}

interface CallSummary {
  id: string;
  summary: string | null;
  main_topics: string[] | null;
  overall_sentiment: string | null;
  customer_satisfaction: number | null;
  agent_performance_score: number | null;
  next_steps: string[] | null;
}

export default function CallHistory() {
  const [sessions, setSessions] = useState<CallSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<CallSession | null>(null);
  const [sessionTranscripts, setSessionTranscripts] = useState<Transcription[]>([]);
  const [sessionAnalyses, setSessionAnalyses] = useState<Analysis[]>([]);
  const [sessionSummary, setSessionSummary] = useState<CallSummary | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('call_sessions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSessionDetails = async (sessionId: string) => {
    setIsLoadingDetails(true);
    try {
      const [transcriptsRes, analysesRes, summaryRes] = await Promise.all([
        supabase
          .from('call_transcriptions')
          .select('*')
          .eq('call_session_id', sessionId)
          .order('created_at', { ascending: true }),
        supabase
          .from('call_analyses')
          .select('*')
          .eq('call_session_id', sessionId)
          .order('created_at', { ascending: true }),
        supabase
          .from('call_summaries')
          .select('*')
          .eq('call_session_id', sessionId)
          .maybeSingle(),
      ]);

      if (transcriptsRes.error) throw transcriptsRes.error;
      if (analysesRes.error) throw analysesRes.error;
      if (summaryRes.error) throw summaryRes.error;

      setSessionTranscripts(transcriptsRes.data || []);
      setSessionAnalyses(analysesRes.data || []);
      setSessionSummary(summaryRes.data);
    } catch (error) {
      console.error('Error fetching session details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSessionClick = async (session: CallSession) => {
    setSelectedSession(session);
    await fetchSessionDetails(session.id);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredSessions = sessions.filter(session => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      session.caller_name?.toLowerCase().includes(query) ||
      session.caller_phone?.toLowerCase().includes(query) ||
      session.agent_name?.toLowerCase().includes(query)
    );
  });

  const exportTranscript = () => {
    if (!selectedSession || sessionTranscripts.length === 0) return;
    
    const text = sessionTranscripts
      .map(t => `[${t.speaker === 'agent' ? 'Agente' : 'Cliente'}]: ${t.text}`)
      .join('\n\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcricao-${selectedSession.caller_name}-${format(new Date(selectedSession.started_at), 'dd-MM-yyyy-HH-mm')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Histórico de Chamadas</h1>
          <p className="text-muted-foreground">
            Visualize transcrições e análises de chamadas anteriores
          </p>
        </div>
        <Button variant="outline" onClick={fetchSessions}>
          Atualizar
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou agente..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </div>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Chamadas Recentes
            <Badge variant="secondary" className="ml-2">
              {filteredSessions.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Phone className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Nenhuma chamada encontrada
              </p>
              <p className="text-sm text-muted-foreground/80">
                As chamadas serão salvas automaticamente quando você encerrar uma ligação
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => handleSessionClick(session)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full',
                        session.status === 'completed' 
                          ? 'bg-success/10 text-success' 
                          : 'bg-warning/10 text-warning'
                      )}>
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{session.caller_name || 'Desconhecido'}</span>
                          <Badge variant="outline" className="text-xs">
                            {session.status === 'completed' ? 'Concluída' : 'Em andamento'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{session.caller_phone || 'Sem número'}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {session.agent_name || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(session.started_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDuration(session.duration_seconds)}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Session Details Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Detalhes da Chamada
            </DialogTitle>
            <DialogDescription>
              {selectedSession && (
                <span>
                  {selectedSession.caller_name} • {format(new Date(selectedSession.started_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="transcription" className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="transcription" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Transcrição ({sessionTranscripts.length})
                  </TabsTrigger>
                  <TabsTrigger value="analysis" className="gap-2">
                    <Brain className="h-4 w-4" />
                    Análises ({sessionAnalyses.length})
                  </TabsTrigger>
                </TabsList>
                
                {sessionTranscripts.length > 0 && (
                  <Button variant="outline" size="sm" className="gap-2" onClick={exportTranscript}>
                    <Download className="h-4 w-4" />
                    Exportar
                  </Button>
                )}
              </div>

              <TabsContent value="transcription">
                <ScrollArea className="h-[400px] rounded-lg border border-border p-4">
                  {sessionTranscripts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">Nenhuma transcrição disponível</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sessionTranscripts.map((t) => (
                        <div
                          key={t.id}
                          className={cn(
                            'flex gap-3',
                            t.speaker === 'agent' ? 'justify-end' : 'justify-start'
                          )}
                        >
                          <div
                            className={cn(
                              'max-w-[75%] rounded-lg px-4 py-3',
                              t.speaker === 'agent'
                                ? 'bg-primary/10 border border-primary/20'
                                : 'bg-warning/10 border border-warning/20'
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn(
                                'text-xs font-medium',
                                t.speaker === 'agent' ? 'text-primary' : 'text-warning'
                              )}>
                                {t.speaker === 'agent' ? 'Agente' : 'Cliente'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(t.created_at), 'HH:mm:ss')}
                              </span>
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
                <ScrollArea className="h-[400px] rounded-lg border border-border p-4">
                  {sessionAnalyses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Brain className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">Nenhuma análise disponível</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sessionAnalyses.map((a) => (
                        <div
                          key={a.id}
                          className="rounded-lg border border-border p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={cn(
                                a.sentiment === 'positive' ? 'text-success' :
                                a.sentiment === 'negative' ? 'text-destructive' : 'text-warning'
                              )}>
                                {a.sentiment === 'positive' ? <TrendingUp className="h-3 w-3 mr-1" /> :
                                 a.sentiment === 'negative' ? <TrendingDown className="h-3 w-3 mr-1" /> :
                                 <Minus className="h-3 w-3 mr-1" />}
                                {a.sentiment}
                              </Badge>
                              <Badge variant="secondary">{a.emotion}</Badge>
                              <Badge variant={
                                a.urgency === 'high' ? 'destructive' : 
                                a.urgency === 'medium' ? 'default' : 'secondary'
                              }>
                                {a.urgency}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(a.created_at), 'HH:mm:ss')}
                            </span>
                          </div>
                          
                          {a.message_analyzed && (
                            <p className="text-sm text-muted-foreground italic">
                              "{a.message_analyzed}"
                            </p>
                          )}
                          
                          {a.suggestion && (
                            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                              <p className="text-xs font-medium text-primary mb-1">Sugestão</p>
                              <p className="text-sm">{a.suggestion}</p>
                            </div>
                          )}
                          
                          {a.risk_alert && (
                            <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3">
                              <p className="text-xs font-medium text-destructive mb-1">Alerta de Risco</p>
                              <p className="text-sm">{a.risk_alert}</p>
                            </div>
                          )}
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
    </div>
  );
}
