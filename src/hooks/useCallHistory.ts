import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from '@/hooks/useAuditLog';
import { logger } from '@/lib/logger';
import { isWithinInterval, startOfDay, endOfDay, subWeeks, subMonths } from 'date-fns';

export interface CallSession {
  id: string;
  caller_name: string | null;
  caller_phone: string | null;
  agent_name: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  status: string | null;
}

export interface SessionWithSummary extends CallSession {
  summary?: {
    overall_sentiment: string | null;
    main_topics: string[] | null;
    customer_satisfaction: number | null;
  };
}

export interface Transcription {
  id: string; speaker: string; text: string;
  start_time: number | null; end_time: number | null; created_at: string;
}

export interface Analysis {
  id: string; sentiment: string | null; urgency: string | null;
  emotion: string | null; suggestion: string | null; risk_alert: string | null;
  message_analyzed: string | null; speaker_role: string | null; created_at: string;
}

export interface CallSummary {
  id: string; summary: string | null; main_topics: string[] | null;
  overall_sentiment: string | null; customer_satisfaction: number | null;
  agent_performance_score: number | null; next_steps: string[] | null;
}

export type DateRangePreset = 'all' | 'today' | 'week' | 'month' | 'custom';
export type SentimentFilter = 'all' | 'positive' | 'neutral' | 'negative';
export type DurationFilter = 'all' | 'short' | 'medium' | 'long';

export function useCallHistory() {
  const { logCallTranscriptionAccess, logCallAnalysisAccess, logDataExport } = useAuditLog();
  const [sessions, setSessions] = useState<SessionWithSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<SessionWithSummary | null>(null);
  const [sessionTranscripts, setSessionTranscripts] = useState<Transcription[]>([]);
  const [sessionAnalyses, setSessionAnalyses] = useState<Analysis[]>([]);
  const [sessionSummary, setSessionSummary] = useState<CallSummary | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('all');
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
   const [customDateTo, setCustomDateTo] = useState<Date | undefined>();
   const [statusFilter, setStatusFilter] = useState<string>('all');
   const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
   const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');
  const [topicFilter, setTopicFilter] = useState<string>('');

  const allTopics = useMemo(() => {
    const topics = new Set<string>();
    sessions.forEach(s => s.summary?.main_topics?.forEach(t => topics.add(t)));
    return Array.from(topics).sort();
  }, [sessions]);

   useEffect(() => { fetchSessions(); }, [searchQuery, statusFilter, sentimentFilter]);

   const fetchSessions = async () => {
     setIsLoading(true);
     try {
       const { data, error } = await supabase.rpc('get_call_history_with_summaries', {
         p_limit: 100,
         p_search: searchQuery,
         p_status: statusFilter,
         p_sentiment: sentimentFilter
       });
 
       if (error) throw error;
 
       const mappedData = (data as any[]).map(item => ({
         ...item,
         summary: item.overall_sentiment ? {
           overall_sentiment: item.overall_sentiment,
           main_topics: item.main_topics,
           customer_satisfaction: item.customer_satisfaction
         } : undefined
       }));
 
       setSessions(mappedData);
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
        supabase.from('call_transcriptions').select('*').eq('call_session_id', sessionId).order('created_at', { ascending: true }),
        supabase.from('call_analyses').select('*').eq('call_session_id', sessionId).order('created_at', { ascending: true }),
        supabase.from('call_summaries').select('*').eq('call_session_id', sessionId).maybeSingle(),
      ]);
      if (transcriptsRes.error) throw transcriptsRes.error;
      if (analysesRes.error) throw analysesRes.error;
      setSessionTranscripts(transcriptsRes.data || []);
      setSessionAnalyses(analysesRes.data || []);
      setSessionSummary(summaryRes.data);
    } catch (error) { logger.error('Error fetching session details:', error); }
    finally { setIsLoadingDetails(false); }
  };

  const handleSessionClick = async (session: SessionWithSummary) => {
    setSelectedSession(session);
    logCallTranscriptionAccess(session.id);
    logCallAnalysisAccess(session.id);
    await fetchSessionDetails(session.id);
  };

  const getDateRange = (): { from: Date; to: Date } | null => {
    const now = new Date();
    switch (dateRangePreset) {
      case 'today': return { from: startOfDay(now), to: endOfDay(now) };
      case 'week': return { from: subWeeks(now, 1), to: now };
      case 'month': return { from: subMonths(now, 1), to: now };
      case 'custom': return customDateFrom && customDateTo ? { from: startOfDay(customDateFrom), to: endOfDay(customDateTo) } : null;
      default: return null;
    }
  };

  const getDurationRange = (filter: DurationFilter) => {
    switch (filter) {
      case 'short': return { min: 0, max: 60 };
      case 'medium': return { min: 60, max: 300 };
      case 'long': return { min: 300, max: Infinity };
      default: return null;
    }
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!session.caller_name?.toLowerCase().includes(q) && !session.caller_phone?.toLowerCase().includes(q) && !session.agent_name?.toLowerCase().includes(q)) return false;
      }
      const dateRange = getDateRange();
      if (dateRange && !isWithinInterval(new Date(session.started_at), { start: dateRange.from, end: dateRange.to })) return false;
      if (sentimentFilter !== 'all' && session.summary?.overall_sentiment !== sentimentFilter) return false;
      const durationRange = getDurationRange(durationFilter);
      if (durationRange) { const d = session.duration_seconds || 0; if (d < durationRange.min || d >= durationRange.max) return false; }
      if (topicFilter && !(session.summary?.main_topics || []).some(t => t.toLowerCase().includes(topicFilter.toLowerCase()))) return false;
      return true;
    });
  }, [sessions, searchQuery, dateRangePreset, customDateFrom, customDateTo, sentimentFilter, durationFilter, topicFilter]);

   const activeFiltersCount = [
     dateRangePreset !== 'all',
     statusFilter !== 'all',
     sentimentFilter !== 'all',
     durationFilter !== 'all',
     topicFilter !== ''
   ].filter(Boolean).length;

  const clearFilters = () => {
    setDateRangePreset('all'); setCustomDateFrom(undefined); setCustomDateTo(undefined);
     setStatusFilter('all'); setSentimentFilter('all'); setDurationFilter('all'); setTopicFilter('');
  };

  const exportTranscript = () => {
    if (!selectedSession || sessionTranscripts.length === 0) return;
    logDataExport('call_transcription', sessionTranscripts.length);
    const text = sessionTranscripts.map(t => `[${t.speaker === 'agent' ? 'Agente' : 'Cliente'}]: ${t.text}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcricao-${selectedSession.caller_name}-${new Date(selectedSession.started_at).toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    sessions: filteredSessions, isLoading, searchQuery, setSearchQuery,
    selectedSession, setSelectedSession, sessionTranscripts, sessionAnalyses, sessionSummary,
    isLoadingDetails, showFilters, setShowFilters, dateRangePreset, setDateRangePreset,
    customDateFrom, setCustomDateFrom, customDateTo, setCustomDateTo,
     statusFilter, setStatusFilter, sentimentFilter, setSentimentFilter,
     durationFilter, setDurationFilter, topicFilter, setTopicFilter,
     allTopics, activeFiltersCount, clearFilters,
    handleSessionClick, exportTranscript, fetchSessions,
  };
}
