import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const log = logger.create('QualityTrend');

interface MosSample { mos: number; t: number }

interface TrendOptions {
  callSessionId?: string | null;
  jitterMs?: number | null;
  rttMs?: number | null;
  /** Callback invocado quando degradação severa é detectada (slope ≤ -0.15 e MOS < 3.5) */
  onSevereDegradation?: (info: { mos: number; slope: number }) => void;
}

/**
 * Analisa tendência de qualidade VoIP em chamada ativa.
 * - Mantém janela das últimas 5 amostras de MOS
 * - Detecta degradação progressiva via slope (regressão linear simples)
 * - Emite toast preventivo + persiste em `voip_quality_alerts`
 * - Dispara callback `onSevereDegradation` para auto-remediação opcional
 */
export function useQualityTrendAnalyzer(
  currentMos: number | null,
  enabled: boolean,
  opts: TrendOptions = {},
) {
  const samplesRef = useRef<MosSample[]>([]);
  const warnedRef = useRef(false);
  const persistedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      samplesRef.current = [];
      warnedRef.current = false;
      persistedRef.current = false;
      return;
    }
    if (currentMos === null || !Number.isFinite(currentMos)) return;

    const now = Date.now();
    samplesRef.current.push({ mos: currentMos, t: now });
    if (samplesRef.current.length > 5) samplesRef.current.shift();
    if (samplesRef.current.length < 5) return;

    const samples = samplesRef.current;
    const xs = samples.map((_, i) => i);
    const ys = samples.map(s => s.mos);
    const xMean = xs.reduce((s, v) => s + v, 0) / xs.length;
    const yMean = ys.reduce((s, v) => s + v, 0) / ys.length;
    let num = 0, den = 0;
    for (let i = 0; i < xs.length; i++) {
      num += (xs[i] - xMean) * (ys[i] - yMean);
      den += (xs[i] - xMean) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;

    const stillAcceptable = currentMos >= 3.6;
    const degrading = slope <= -0.15 && stillAcceptable;
    const severe = slope <= -0.15 && currentMos < 3.5;

    if (degrading && !warnedRef.current) {
      warnedRef.current = true;
      log.warn('Qualidade degradando', { slope: slope.toFixed(3), mos: currentMos });
      toast.warning('Qualidade da chamada degradando', {
        description: 'Verifique sua conexão de internet — possível queda iminente.',
        duration: 6000,
      });

      // Persiste alerta (best-effort, não bloqueia UX)
      if (!persistedRef.current) {
        persistedRef.current = true;
        void persistAlert({
          alert_type: severe ? 'poor' : 'degrading',
          mos_at_alert: Number(currentMos.toFixed(2)),
          slope: Number(slope.toFixed(3)),
          jitter_ms: opts.jitterMs ?? null,
          rtt_ms: opts.rttMs ?? null,
          call_session_id: opts.callSessionId ?? null,
        });
      }
    } else if (slope > -0.05) {
      warnedRef.current = false;
      persistedRef.current = false;
    }

    if (severe && opts.onSevereDegradation) {
      opts.onSevereDegradation({ mos: currentMos, slope });
    }
  }, [currentMos, enabled, opts]);
}

async function persistAlert(payload: {
  alert_type: 'degrading' | 'poor' | 'offline';
  mos_at_alert: number | null;
  slope: number | null;
  jitter_ms: number | null;
  rtt_ms: number | null;
  call_session_id: string | null;
}) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;
    const { error } = await supabase.from('voip_quality_alerts').insert({
      user_id: userId,
      ...payload,
    });
    if (error) log.warn('Falha ao persistir alerta', error);
  } catch (e) {
    log.warn('Erro inesperado ao persistir alerta', e);
  }
}
