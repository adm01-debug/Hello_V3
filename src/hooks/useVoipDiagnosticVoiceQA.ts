import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { traceHeaders, withTrace } from '@/lib/tracing';
import { logger } from '@/lib/logger';

const log = logger.create('useVoipDiagnosticVoiceQA');

export type QAPeriod = 'day' | 'week' | 'month';

export interface VoiceQACitation {
  type: 'recommendation' | 'alert' | 'metric' | 'action';
  label: string;
  ref?: string;
}

export interface VoiceQAResult {
  answer: string;
  citations: VoiceQACitation[];
  confidence: 'high' | 'medium' | 'low';
  contextSize: number;
  requestId: string;
}

export interface VoiceQAInput {
  question: string;
  period?: QAPeriod;
}

export function useVoipDiagnosticVoiceQA() {
  return useMutation<VoiceQAResult, Error, VoiceQAInput>({
    mutationFn: async ({ question, period = 'week' }) => {
      return await withTrace('voip.voice-qa', async () => {
        const { data, error } = await supabase.functions.invoke('voip-diagnostic-voice-qa', {
          headers: traceHeaders(),
          body: { question, period },
        });
        if (error) {
          log.error('Falha no Q&A VoIP', error);
          throw error;
        }
        return data as VoiceQAResult;
      });
    },
  });
}
