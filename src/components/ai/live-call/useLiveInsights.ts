import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { RealtimeInsight, TranscriptEntry } from './types';

interface UseLiveInsightsInput {
  isActive: boolean;
  transcripts: TranscriptEntry[];
  callSessionId?: string;
  callStartedAt?: Date;
  onAnalysis?: (analysis: {
    sentiment: string;
    urgency: string;
    emotion: string;
    suggestion: string;
    riskAlert: boolean;
    riskReason: string;
    messageAnalyzed: string;
    speakerRole: string;
  }) => void;
}

export function useLiveInsights({
  isActive,
  transcripts,
  callSessionId,
  callStartedAt,
  onAnalysis,
}: UseLiveInsightsInput) {
  const [insights, setInsights] = useState<RealtimeInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [overallSentiment, setOverallSentiment] = useState(50);
  const [isConnectedToTranscription, setIsConnectedToTranscription] = useState(false);
  const lastAnalyzedIndexRef = useRef(0);
  const lastSnapshotAtRef = useRef<number>(0);

  const analyzeTranscript = useCallback(
    async (text: string, speaker: string, context: string) => {
      setIsAnalyzing(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        if (!accessToken) {
          logger.warn('No active session for realtime analysis');
          setIsAnalyzing(false);
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/realtime-analysis`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({
              latestMessage: text,
              conversationContext: context,
              speakerRole: speaker,
            }),
          },
        );

        if (!response.ok) return;
        const insight: RealtimeInsight = await response.json();
        insight.timestamp = new Date();

        setInsights((prev) => [...prev.slice(-9), insight]);

        const sentimentValue =
          insight.sentiment === 'positive' ? 75 : insight.sentiment === 'negative' ? 25 : 50;
        setOverallSentiment((prev) => Math.round(prev * 0.7 + sentimentValue * 0.3));

        const now = Date.now();
        if (callSessionId && now - lastSnapshotAtRef.current >= 5000) {
          lastSnapshotAtRef.current = now;
          const elapsed = callStartedAt
            ? Math.max(0, Math.floor((now - callStartedAt.getTime()) / 1000))
            : 0;
          const score =
            insight.sentiment === 'positive' ? 0.7 : insight.sentiment === 'negative' ? -0.7 : 0;
          supabase
            .from('live_sentiment_snapshots')
            .insert({
              call_session_id: callSessionId,
              timestamp_seconds: elapsed,
              sentiment: insight.sentiment,
              score,
              urgency: insight.urgency,
              emotion: insight.emotion,
            })
            .then(({ error }) => {
              if (error) logger.warn('Sentiment snapshot insert failed', error);
            });
        }

        onAnalysis?.({
          sentiment: insight.sentiment,
          urgency: insight.urgency,
          emotion: insight.emotion,
          suggestion: insight.suggestion,
          riskAlert: insight.riskAlert,
          riskReason: insight.riskReason,
          messageAnalyzed: text,
          speakerRole: speaker,
        });
      } catch (error) {
        logger.error('Analysis error:', error);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [onAnalysis, callSessionId, callStartedAt],
  );

  useEffect(() => {
    if (!isActive || transcripts.length === 0) return;
    if (transcripts.length > lastAnalyzedIndexRef.current) {
      setIsConnectedToTranscription(true);
      const newTranscripts = transcripts.slice(lastAnalyzedIndexRef.current);
      lastAnalyzedIndexRef.current = transcripts.length;
      const context = transcripts
        .slice(-5)
        .map((t) => `${t.speaker === 'agent' ? 'Agente' : 'Cliente'}: ${t.text}`)
        .join('\n');
      const latest = newTranscripts[newTranscripts.length - 1];
      if (latest) analyzeTranscript(latest.text, latest.speaker, context);
    }
  }, [isActive, transcripts, analyzeTranscript]);

  useEffect(() => {
    if (!isActive) {
      lastAnalyzedIndexRef.current = 0;
      setIsConnectedToTranscription(false);
    }
  }, [isActive]);

  return { insights, isAnalyzing, overallSentiment, isConnectedToTranscription };
}
