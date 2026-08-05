import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const log = logger.create('useVoipAnomalies');

export type AnomalyKind = 'spike' | 'drift' | 'outage';
export type AnomalyMetric = 'mos' | 'jitter' | 'volume';

export interface DetectedAnomaly {
  id: string;
  metric: AnomalyMetric;
  kind: AnomalyKind;
  expected: number;
  observed: number;
  std: number;
  z_score: number;
  severity: 'warning' | 'critical';
  started_at: string;
  bucket_hour: number;
  bucket_dow: number;
}

interface AnomaliesResponse {
  anomalies: Array<Omit<DetectedAnomaly, 'id' | 'kind'>>;
  window_hours: number;
  baseline_samples: number;
}

/** Classifica anomalia em spike / drift / outage de forma determinística. */
function classify(
  a: Omit<DetectedAnomaly, 'id' | 'kind'>,
): AnomalyKind {
  const absZ = Math.abs(a.z_score);
  // outage: queda crítica de MOS ou perda massiva de volume
  if (a.metric === 'mos' && a.severity === 'critical' && a.observed < 2.5) return 'outage';
  if (a.metric === 'volume' && a.severity === 'critical' && a.observed === 0) return 'outage';
  // drift: desvio sustentado moderado
  if (absZ >= 2.5 && absZ < 3.5) return 'drift';
  // spike: pico isolado
  return 'spike';
}

/** ID estável derivado de bucket+métrica para idempotência. */
function makeId(a: Omit<DetectedAnomaly, 'id' | 'kind'>): string {
  return `${a.metric}-${a.bucket_dow}-${a.bucket_hour}-${a.started_at.slice(0, 13)}`;
}

export function useVoipAnomalies(periodHours: number = 24) {
  return useQuery({
    queryKey: ['voip-anomalies', periodHours],
    staleTime: 120_000,
    refetchInterval: 120_000,
    queryFn: async (): Promise<DetectedAnomaly[]> => {
      const { data, error } = await supabase.functions.invoke<AnomaliesResponse>(
        'voip-anomaly-detector',
        { body: undefined },
      );
      if (error) {
        log.error('Falha ao buscar anomalias', error);
        throw error;
      }
      const raw = data?.anomalies ?? [];
      return raw.map((a) => ({
        ...a,
        id: makeId(a),
        kind: classify(a),
      }));
    },
  });
}
