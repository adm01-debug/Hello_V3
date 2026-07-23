import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, subWeeks, subMonths, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { logger } from '@/lib/logger';
import { safeFormatDate, safeFormatDatePtBR } from "@/lib/safe-date";

interface CallSession {
  id: string;
  started_at: string;
  duration_seconds: number | null;
  status: string | null;
}

interface CallSummary {
  call_session_id: string;
  overall_sentiment: string | null;
  main_topics: string[] | null;
  customer_satisfaction: number | null;
  agent_performance_score: number | null;
}

export type DateRange = 'week' | 'month' | '3months' | 'all';

export function useCallAnalytics() {
  const [sessions, setSessions] = useState<CallSession[]>([]);
  const [summaries, setSummaries] = useState<CallSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('month');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sessionsRes, summariesRes] = await Promise.all([
        supabase
          .from('call_sessions')
          .select('id, started_at, duration_seconds, status')
          .eq('status', 'completed')
          .order('started_at', { ascending: false }),
        supabase
          .from('call_summaries')
          .select('call_session_id, overall_sentiment, main_topics, customer_satisfaction, agent_performance_score'),
      ]);
      if (sessionsRes.error) throw sessionsRes.error;
      if (summariesRes.error) throw summariesRes.error;
      setSessions(sessionsRes.data || []);
      setSummaries(summariesRes.data || []);
    } catch (error) {
      logger.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getDateRangeStart = (): Date | null => {
    const now = new Date();
    switch (dateRange) {
      case 'week': return subWeeks(now, 1);
      case 'month': return subMonths(now, 1);
      case '3months': return subMonths(now, 3);
      default: return null;
    }
  };

  const filteredData = useMemo(() => {
    const rangeStart = getDateRangeStart();
    const filteredSessions = rangeStart
      ? sessions.filter(s => isAfter(new Date(s.started_at), rangeStart))
      : sessions;
    const sessionIds = new Set(filteredSessions.map(s => s.id));
    const filteredSummaries = summaries.filter(s => sessionIds.has(s.call_session_id));
    return { sessions: filteredSessions, summaries: filteredSummaries };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, summaries, dateRange]);

  const stats = useMemo(() => {
    const { sessions: fSessions, summaries: fSummaries } = filteredData;
    const totalCalls = fSessions.length;

    const durationsWithValue = fSessions.filter(s => s.duration_seconds && s.duration_seconds > 0);
    const avgDuration = durationsWithValue.length > 0
      ? durationsWithValue.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) / durationsWithValue.length
      : 0;

    const satisfactionScores = fSummaries.map(s => s.customer_satisfaction).filter((s): s is number => s !== null);
    const avgSatisfaction = satisfactionScores.length > 0
      ? satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length : 0;

    const performanceScores = fSummaries.map(s => s.agent_performance_score).filter((s): s is number => s !== null);
    const avgPerformance = performanceScores.length > 0
      ? performanceScores.reduce((a, b) => a + b, 0) / performanceScores.length : 0;

    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    fSummaries.forEach(s => {
      if (s.overall_sentiment === 'positive') sentimentCounts.positive++;
      else if (s.overall_sentiment === 'negative') sentimentCounts.negative++;
      else if (s.overall_sentiment === 'neutral') sentimentCounts.neutral++;
    });

    const topicCounts: Record<string, number> = {};
    fSummaries.forEach(s => {
      s.main_topics?.forEach(topic => { topicCounts[topic] = (topicCounts[topic] || 0) + 1; });
    });
    const topTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

    const callsByDay: Record<string, number> = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'));
    last7Days.forEach(day => callsByDay[day] = 0);
    fSessions.forEach(s => {
      const day = safeFormatDate(s.started_at, 'yyyy-MM-dd');
      if (callsByDay[day] !== undefined) callsByDay[day]++;
    });

    return {
      totalCalls, avgDuration, avgSatisfaction, avgPerformance,
      sentimentCounts, topTopics,
      callsByDay: last7Days.map(day => ({
        date: safeFormatDatePtBR(day, 'dd/MM'),
        calls: callsByDay[day],
      })),
      summariesCount: fSummaries.length,
    };
  }, [filteredData]);

  const sentimentChartData = [
    { name: 'Positivo', value: stats.sentimentCounts.positive, color: 'hsl(var(--success))' },
    { name: 'Neutro', value: stats.sentimentCounts.neutral, color: 'hsl(var(--warning))' },
    { name: 'Negativo', value: stats.sentimentCounts.negative, color: 'hsl(var(--destructive))' },
  ].filter(d => d.value > 0);

  return { isLoading, dateRange, setDateRange, stats, sentimentChartData };
}
