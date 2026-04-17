import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const log = logger.create('CallSession');

interface TranscriptEntry {
  id: string;
  text: string;
  speaker: 'agent' | 'customer';
  speakerLabel: string;
  timestamp: Date;
  startTime?: number;
  endTime?: number;
}

interface AnalysisEntry {
  sentiment: string;
  urgency: string;
  emotion: string;
  suggestion: string;
  riskAlert: boolean;
  riskReason: string;
  messageAnalyzed: string;
  speakerRole: string;
}

interface CallSession {
  id: string;
  callerName: string;
  callerPhone: string;
  agentName?: string;
  startedAt: Date;
}

export function useCallSession() {
  const [currentSession, setCurrentSession] = useState<CallSession | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const pendingTranscriptsRef = useRef<TranscriptEntry[]>([]);
  const pendingAnalysesRef = useRef<AnalysisEntry[]>([]);
  const allTranscriptsRef = useRef<TranscriptEntry[]>([]);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startSession = useCallback(async (callerName: string, callerPhone: string, agentName?: string) => {
    try {
      const { data, error } = await supabase
        .from('call_sessions')
        .insert({ caller_name: callerName, caller_phone: callerPhone, agent_name: agentName, status: 'active' })
        .select().single();
      if (error) throw error;

      const session: CallSession = {
        id: data.id, callerName: data.caller_name ?? '', callerPhone: data.caller_phone ?? '',
        agentName: data.agent_name ?? undefined, startedAt: new Date(data.started_at),
      };
      setCurrentSession(session);
      allTranscriptsRef.current = [];
      log.info('Call session started', { sessionId: session.id });
      return session;
    } catch (error) {
      log.error('Error starting call session', error);
      return null;
    }
  }, []);

  const saveTranscripts = useCallback(async () => {
    if (!currentSession || pendingTranscriptsRef.current.length === 0) return;
    const transcriptsToSave = [...pendingTranscriptsRef.current];
    pendingTranscriptsRef.current = [];
    try {
      const { error } = await supabase.from('call_transcriptions').insert(
        transcriptsToSave.map((t) => ({
          call_session_id: currentSession.id, speaker: t.speaker, text: t.text,
          start_time: t.startTime, end_time: t.endTime,
        }))
      );
      if (error) throw error;
      allTranscriptsRef.current.push(...transcriptsToSave);
      log.info(`Saved ${transcriptsToSave.length} transcripts`);
    } catch (error) {
      log.error('Error saving transcripts', error);
      pendingTranscriptsRef.current = [...transcriptsToSave, ...pendingTranscriptsRef.current];
    }
  }, [currentSession]);

  const saveAnalyses = useCallback(async () => {
    if (!currentSession || pendingAnalysesRef.current.length === 0) return;
    const analysesToSave = [...pendingAnalysesRef.current];
    pendingAnalysesRef.current = [];
    try {
      const { error } = await supabase.from('call_analyses').insert(
        analysesToSave.map((a) => ({
          call_session_id: currentSession.id, sentiment: a.sentiment, urgency: a.urgency,
          emotion: a.emotion, suggestion: a.suggestion, risk_alert: a.riskAlert ? a.riskReason : null,
          message_analyzed: a.messageAnalyzed, speaker_role: a.speakerRole,
        }))
      );
      if (error) throw error;
      log.info(`Saved ${analysesToSave.length} analyses`);
    } catch (error) {
      log.error('Error saving analyses', error);
      pendingAnalysesRef.current = [...analysesToSave, ...pendingAnalysesRef.current];
    }
  }, [currentSession]);

  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      await Promise.all([saveTranscripts(), saveAnalyses()]);
    }, 2000);
  }, [saveTranscripts, saveAnalyses]);

  const addTranscript = useCallback((transcript: TranscriptEntry) => {
    if (!currentSession) return;
    pendingTranscriptsRef.current.push(transcript);
    scheduleSave();
  }, [currentSession, scheduleSave]);

  const addAnalysis = useCallback((analysis: AnalysisEntry) => {
    if (!currentSession) return;
    pendingAnalysesRef.current.push(analysis);
    scheduleSave();
  }, [currentSession, scheduleSave]);

  const runPostCallIntelligence = useCallback(async (sessionId: string, agentName: string | undefined, durationSeconds: number) => {
    const transcripts = allTranscriptsRef.current;
    if (transcripts.length === 0) return;

    const fullText = transcripts.map((t) => `[${t.speaker}] ${t.text}`).join('\n');

    // Populate searchable transcripts (trigger keeps tsvector updated).
    try {
      await (supabase.from('call_transcripts_searchable') as any).upsert({
        call_session_id: sessionId,
        full_text: fullText,
        agent_name: agentName ?? null,
        duration_seconds: durationSeconds,
      }, { onConflict: 'call_session_id' });
    } catch (e) {
      log.error('Failed to populate searchable transcripts', e);
    }

    // Build segments for talk ratio (uses startTime/endTime when available, falls back to sequential window).
    const segments = transcripts.map((t, idx) => ({
      speaker: t.speaker,
      start: typeof t.startTime === 'number' ? t.startTime : idx * 5,
      end: typeof t.endTime === 'number' ? t.endTime : idx * 5 + 5,
    }));

    // Fire-and-forget background analyses.
    void supabase.functions.invoke('analyze-talk-ratio', {
      body: { callSessionId: sessionId, segments, totalDuration: durationSeconds },
    }).catch((e) => log.error('analyze-talk-ratio failed', e));

    void supabase.functions.invoke('detect-key-moments', {
      body: { callSessionId: sessionId, transcript: fullText },
    }).catch((e) => log.error('detect-key-moments failed', e));

    // Auto-gera resumo IA pós-call (≥60s + transcrição disponível)
    if (durationSeconds >= 60 && transcripts.length > 0) {
      void supabase.functions.invoke('generate-meeting-summary', {
        body: { callSessionId: sessionId },
      }).catch((e) => log.error('generate-meeting-summary failed', e));
    }
  }, []);

  const endSession = useCallback(async (durationSeconds: number, summary?: {
    summary: string; mainTopics: string[]; overallSentiment: string;
    customerSatisfaction: number; agentPerformance: number; nextSteps: string[];
  }) => {
    if (!currentSession) return;
    setIsSaving(true);
    try {
      await Promise.all([saveTranscripts(), saveAnalyses()]);
      const { error: sessionError } = await supabase.from('call_sessions')
        .update({ ended_at: new Date().toISOString(), duration_seconds: durationSeconds, status: 'completed' })
        .eq('id', currentSession.id);
      if (sessionError) throw sessionError;

      if (summary) {
        const { error: summaryError } = await supabase.from('call_summaries').insert({
          call_session_id: currentSession.id, summary: summary.summary, main_topics: summary.mainTopics,
          overall_sentiment: summary.overallSentiment, customer_satisfaction: summary.customerSatisfaction,
          agent_performance_score: summary.agentPerformance, next_steps: summary.nextSteps,
        });
        if (summaryError) throw summaryError;
      }

      // Trigger background intelligence (talk ratio, key moments, searchable index).
      await runPostCallIntelligence(currentSession.id, currentSession.agentName, durationSeconds);

      log.info('Call session ended', { sessionId: currentSession.id });
    } catch (error) {
      log.error('Error ending call session', error);
    } finally {
      setIsSaving(false);
      setCurrentSession(null);
      allTranscriptsRef.current = [];
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    }
  }, [currentSession, saveTranscripts, saveAnalyses, runPostCallIntelligence]);

  return { currentSession, isSaving, startSession, endSession, addTranscript, addAnalysis };
}
