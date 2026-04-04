import { useState, useEffect, useMemo } from 'react';
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
  Minus,
  X,
  Tag
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, startOfDay, endOfDay, subDays, subWeeks, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuditLog } from '@/hooks/useAuditLog';
import { logger } from '@/lib/logger';

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

interface SessionWithSummary extends CallSession {
  summary?: {
    overall_sentiment: string | null;
    main_topics: string[] | null;
    customer_satisfaction: number | null;
  };
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

type DateRangePreset = 'all' | 'today' | 'week' | 'month' | 'custom';
type SentimentFilter = 'all' | 'positive' | 'neutral' | 'negative';
type DurationFilter = 'all' | 'short' | 'medium' | 'long';

export default function CallHistory() {
  const { logCallTranscriptionAccess, logCallAnalysisAccess, logDataExport } = useAuditLog();
  const [sessions, setSessions] = useState<SessionWithSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<SessionWithSummary | null>(null);
  const [sessionTranscripts, setSessionTranscripts] = useState<Transcription[]>([]);
  const [sessionAnalyses, setSessionAnalyses] = useState<Analysis[]>([]);
  const [sessionSummary, setSessionSummary] = useState<CallSummary | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('all');
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');
  const [topicFilter, setTopicFilter] = useState<string>('');
  
  // All unique topics from sessions
  const allTopics = useMemo(() => {
    const topics = new Set<string>();
    sessions.forEach(s => {
      s.summary?.main_topics?.forEach(t => topics.add(t));
    });
    return Array.from(topics).sort();
  }, [sessions]);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      // Fetch sessions with summaries
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('call_sessions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(100);

      if (sessionsError) throw sessionsError;

      // Fetch summaries for all sessions
      const sessionIds = sessionsData?.map(s => s.id) || [];
      const { data: summariesData, error: summariesError } = await supabase
        .from('call_summaries')
        .select('call_session_id, overall_sentiment, main_topics, customer_satisfaction')
        .in('call_session_id', sessionIds);

      if (summariesError) throw summariesError;

      // Merge summaries with sessions
      const summariesMap = new Map(
        summariesData?.map(s => [s.call_session_id, {
          overall_sentiment: s.overall_sentiment,
          main_topics: s.main_topics,
          customer_satisfaction: s.customer_satisfaction
        }])
      );

      const sessionsWithSummary: SessionWithSummary[] = (sessionsData || []).map(session => ({
        ...session,
        summary: summariesMap.get(session.id)
      }));

      setSessions(sessionsWithSummary);
    } catch (error) {
      logger.error('Error fetching sessions:', error);
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
      logger.error('Error fetching session details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSessionClick = async (session: SessionWithSummary) => {
    setSelectedSession(session);
    // Log audit event for transcription/analysis access
    logCallTranscriptionAccess(session.id);
    logCallAnalysisAccess(session.id);
    await fetchSessionDetails(session.id);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDateRange = (): { from: Date; to: Date } | null => {
    const now = new Date();
    switch (dateRangePreset) {
      case 'today':
        return { from: startOfDay(now), to: endOfDay(now) };
      case 'week':
        return { from: subWeeks(now, 1), to: now };
      case 'month':
        return { from: subMonths(now, 1), to: now };
      case 'custom':
        if (customDateFrom && customDateTo) {
          return { from: startOfDay(customDateFrom), to: endOfDay(customDateTo) };
        }
        return null;
      default:
        return null;
    }
  };

  const getDurationRange = (filter: DurationFilter): { min: number; max: number } | null => {
    switch (filter) {
      case 'short': return { min: 0, max: 60 }; // < 1 min
      case 'medium': return { min: 60, max: 300 }; // 1-5 min
      case 'long': return { min: 300, max: Infinity }; // > 5 min
      default: return null;
    }
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      // Text search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesText = 
          session.caller_name?.toLowerCase().includes(query) ||
          session.caller_phone?.toLowerCase().includes(query) ||
          session.agent_name?.toLowerCase().includes(query);
        if (!matchesText) return false;
      }

      // Date filter
      const dateRange = getDateRange();
      if (dateRange) {
        const sessionDate = new Date(session.started_at);
        if (!isWithinInterval(sessionDate, { start: dateRange.from, end: dateRange.to })) {
          return false;
        }
      }

      // Sentiment filter
      if (sentimentFilter !== 'all') {
        if (session.summary?.overall_sentiment !== sentimentFilter) {
          return false;
        }
      }

      // Duration filter
      const durationRange = getDurationRange(durationFilter);
      if (durationRange) {
        const duration = session.duration_seconds || 0;
        if (duration < durationRange.min || duration >= durationRange.max) {
          return false;
        }
      }

      // Topic filter
      if (topicFilter) {
        const topics = session.summary?.main_topics || [];
        if (!topics.some(t => t.toLowerCase().includes(topicFilter.toLowerCase()))) {
          return false;
        }
      }

      return true;
    });
  }, [sessions, searchQuery, dateRangePreset, customDateFrom, customDateTo, sentimentFilter, durationFilter, topicFilter]);

  const activeFiltersCount = [
    dateRangePreset !== 'all',
    sentimentFilter !== 'all',
    durationFilter !== 'all',
    topicFilter !== ''
  ].filter(Boolean).length;

  const clearFilters = () => {
    setDateRangePreset('all');
    setCustomDateFrom(undefined);
    setCustomDateTo(undefined);
    setSentimentFilter('all');
    setDurationFilter('all');
    setTopicFilter('');
  };

  const exportTranscript = () => {
    if (!selectedSession || sessionTranscripts.length === 0) return;
    
    // Log audit event for export
    logDataExport('call_transcription', sessionTranscripts.length);
    
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

  const getSentimentBadge = (sentiment: string | null | undefined) => {
    if (!sentiment) return null;
    return (
      <Badge variant="outline" className={cn(
        'text-xs',
        sentiment === 'positive' ? 'text-success border-success/50' :
        sentiment === 'negative' ? 'text-destructive border-destructive/50' : 
        'text-warning border-warning/50'
      )}>
        {sentiment === 'positive' ? <TrendingUp className="h-3 w-3 mr-1" /> :
         sentiment === 'negative' ? <TrendingDown className="h-3 w-3 mr-1" /> :
         <Minus className="h-3 w-3 mr-1" />}
        {sentiment === 'positive' ? 'Positivo' : 
         sentiment === 'negative' ? 'Negativo' : 'Neutro'}
      </Badge>
    );
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

      {/* Search and Filters */}
      <div className="space-y-4">
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
          <Button 
            variant={showFilters ? 'default' : 'outline'} 
            className="gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card className="border-dashed">
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Período
                  </label>
                  <Select value={dateRangePreset} onValueChange={(v) => setDateRangePreset(v as DateRangePreset)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os períodos</SelectItem>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="week">Última semana</SelectItem>
                      <SelectItem value="month">Último mês</SelectItem>
                      <SelectItem value="custom">Período personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {dateRangePreset === 'custom' && (
                    <div className="flex gap-2 mt-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1 justify-start text-left font-normal">
                            {customDateFrom ? format(customDateFrom, 'dd/MM/yy') : 'De'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={customDateFrom}
                            onSelect={setCustomDateFrom}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1 justify-start text-left font-normal">
                            {customDateTo ? format(customDateTo, 'dd/MM/yy') : 'Até'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={customDateTo}
                            onSelect={setCustomDateTo}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>

                {/* Sentiment Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Sentimento
                  </label>
                  <Select value={sentimentFilter} onValueChange={(v) => setSentimentFilter(v as SentimentFilter)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar sentimento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="positive">
                        <span className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3 text-success" />
                          Positivo
                        </span>
                      </SelectItem>
                      <SelectItem value="neutral">
                        <span className="flex items-center gap-2">
                          <Minus className="h-3 w-3 text-warning" />
                          Neutro
                        </span>
                      </SelectItem>
                      <SelectItem value="negative">
                        <span className="flex items-center gap-2">
                          <TrendingDown className="h-3 w-3 text-destructive" />
                          Negativo
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Duration Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Duração
                  </label>
                  <Select value={durationFilter} onValueChange={(v) => setDurationFilter(v as DurationFilter)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar duração" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="short">Curta (&lt; 1 min)</SelectItem>
                      <SelectItem value="medium">Média (1-5 min)</SelectItem>
                      <SelectItem value="long">Longa (&gt; 5 min)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Topic Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tópico
                  </label>
                  {allTopics.length > 0 ? (
                    <Select value={topicFilter} onValueChange={setTopicFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar tópico" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos os tópicos</SelectItem>
                        {allTopics.map(topic => (
                          <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder="Buscar tópico..."
                      value={topicFilter}
                      onChange={(e) => setTopicFilter(e.target.value)}
                    />
                  )}
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <div className="flex justify-end mt-4">
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                    <X className="h-4 w-4" />
                    Limpar filtros
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
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
                {activeFiltersCount > 0 ? 'Nenhuma chamada encontrada com os filtros aplicados' : 'Nenhuma chamada encontrada'}
              </p>
              {activeFiltersCount > 0 && (
                <Button variant="link" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              )}
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
                          {getSentimentBadge(session.summary?.overall_sentiment)}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{session.caller_phone || 'Sem número'}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {session.agent_name || 'N/A'}
                          </span>
                          {session.summary?.main_topics && session.summary.main_topics.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {session.summary.main_topics.slice(0, 2).join(', ')}
                              </span>
                            </>
                          )}
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

              {/* Summary Card */}
              {sessionSummary && (
                <Card className="mb-4 bg-primary/5 border-primary/20">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-sm text-primary mb-1">Resumo da Chamada</h4>
                          <p className="text-sm">{sessionSummary.summary}</p>
                        </div>
                        {getSentimentBadge(sessionSummary.overall_sentiment)}
                      </div>
                      
                      {sessionSummary.main_topics && sessionSummary.main_topics.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {sessionSummary.main_topics.map((topic, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-6 text-sm">
                        {sessionSummary.customer_satisfaction && (
                          <div>
                            <span className="text-muted-foreground">Satisfação: </span>
                            <span className="font-medium">{sessionSummary.customer_satisfaction}/10</span>
                          </div>
                        )}
                        {sessionSummary.agent_performance_score && (
                          <div>
                            <span className="text-muted-foreground">Performance: </span>
                            <span className="font-medium">{sessionSummary.agent_performance_score}/10</span>
                          </div>
                        )}
                      </div>

                      {sessionSummary.next_steps && sessionSummary.next_steps.length > 0 && (
                        <div>
                          <span className="text-xs text-muted-foreground">Próximos passos:</span>
                          <ul className="list-disc list-inside text-sm mt-1">
                            {sessionSummary.next_steps.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <TabsContent value="transcription">
                <ScrollArea className="h-[350px] rounded-lg border border-border p-4">
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
                <ScrollArea className="h-[350px] rounded-lg border border-border p-4">
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
