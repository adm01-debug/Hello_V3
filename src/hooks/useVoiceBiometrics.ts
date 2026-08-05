import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { traceHeaders, withTrace } from '@/lib/tracing';
import { captureVoiceSample, type ExtractedFeatures } from '@/lib/voice-biometrics';

const log = logger.create('VoiceBiometrics');

export interface VoicePrint {
  id: string;
  user_id: string;
  label: string;
  sample_count: number;
  confidence_baseline: number;
  enrolled_at: string;
  last_verified_at: string | null;
  is_active: boolean;
  feature_summary: Record<string, unknown> | null;
}

export interface VerifyResult {
  enrolled: boolean;
  similarity?: number;
  match?: boolean;
  confidence?: number;
  risk?: 'low' | 'medium' | 'high';
  message?: string;
}

export function useVoicePrints() {
  const queryClient = useQueryClient();
  const [isCapturing, setIsCapturing] = useState(false);

  const list = useQuery({
    queryKey: ['voice-prints'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('voice_prints')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as VoicePrint[];
    },
  });

  const enroll = useMutation({
    mutationFn: async ({ label = 'primary', samples = 3 }: { label?: string; samples?: number }) => {
      setIsCapturing(true);
      try {
        const collected: ExtractedFeatures[] = [];
        for (let i = 0; i < samples; i++) {
          toast.info(`Capturando amostra ${i + 1}/${samples}... fale por 4 segundos.`);
          const features = await captureVoiceSample();
          collected.push(features);
        }
        const { data, error } = await withTrace('voice.enroll', () =>
          supabase.functions.invoke('enroll-voice', {
            body: {
              label,
              embedding: collected.map((c) => c.embedding),
              summary: collected[0].summary,
            },
            headers: traceHeaders(),
          }),
        );
        if (error) throw error;
        return data;
      } finally {
        setIsCapturing(false);
      }
    },
    onSuccess: () => {
      toast.success('Voice print cadastrada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['voice-prints'] });
    },
    onError: (err) => {
      log.error('enroll failed', err);
      toast.error('Falha no enrolamento de voz');
    },
  });

  const verify = useMutation({
    mutationFn: async ({ label = 'primary', callSessionId }: { label?: string; callSessionId?: string }) => {
      setIsCapturing(true);
      try {
        toast.info('Capturando amostra para verificação...');
        const features = await captureVoiceSample();
        const { data, error } = await withTrace('voice.verify', () =>
          supabase.functions.invoke('verify-voice', {
            body: { label, callSessionId, embedding: features.embedding },
            headers: traceHeaders(),
          }),
        );
        if (error) throw error;
        return data as VerifyResult;
      } finally {
        setIsCapturing(false);
      }
    },
    onError: (err) => {
      log.error('verify failed', err);
      toast.error('Falha na verificação');
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('voice_prints').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Voice print removida');
      queryClient.invalidateQueries({ queryKey: ['voice-prints'] });
    },
  });

  return {
    voicePrints: list.data ?? [],
    isLoading: list.isLoading,
    isCapturing,
    enroll: enroll.mutate,
    isEnrolling: enroll.isPending,
    verify: verify.mutateAsync,
    isVerifying: verify.isPending,
    remove: remove.mutate,
  };
}

export interface FraudSignal {
  id: string;
  call_session_id: string;
  agent_name: string | null;
  signal_type: string;
  risk_score: number;
  severity: 'low' | 'medium' | 'high';
  evidence: Record<string, unknown>;
  description: string | null;
  status: string;
  created_at: string;
}

export function useFraudSignals(filters?: { severity?: string; status?: string; limit?: number }) {
  return useQuery({
    queryKey: ['fraud-signals', filters],
    queryFn: async () => {
      let q = supabase
        .from('fraud_signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(filters?.limit ?? 100);
      if (filters?.severity) q = q.eq('severity', filters.severity);
      if (filters?.status) q = q.eq('status', filters.status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as FraudSignal[];
    },
  });
}

export function useRedactCall() {
  return useMutation({
    mutationFn: async (callSessionId: string) => {
      const { data, error } = await withTrace('voice.redact', () =>
        supabase.functions.invoke('redact-sensitive-audio', {
          body: { callSessionId },
          headers: traceHeaders(),
        }),
      );
      if (error) throw error;
      return data as { matches: number; patterns: Record<string, number>; segments_count: number };
    },
    onSuccess: (data) => {
      toast.success(`Redação concluída — ${data.matches} matches encontrados`);
    },
    onError: (err) => {
      logger.error('redact failed', err);
      toast.error('Falha ao redatar transcrição');
    },
  });
}

/** Helper para iniciar verificação ao vivo durante uma chamada. */
export function useLiveVoiceVerification(callSessionId?: string) {
  const { verify, isVerifying } = useVoicePrints();
  const [lastVerdict, setLastVerdict] = useState<VerifyResult | null>(null);

  const run = useCallback(async () => {
    if (!callSessionId) return null;
    const result = await verify({ callSessionId });
    setLastVerdict(result);
    if (result?.match === false) {
      toast.warning('⚠️ Voz não confere com o padrão cadastrado');
    } else if (result?.match) {
      toast.success(`Voz verificada (${result.confidence}%)`);
    }
    return result;
  }, [callSessionId, verify]);

  return { run, isVerifying, lastVerdict };
}
