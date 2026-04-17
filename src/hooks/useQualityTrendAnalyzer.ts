import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger.create('QualityTrend');

interface MosSample { mos: number; t: number }

/**
 * Analisa tendência de qualidade VoIP em chamada ativa.
 * - Mantém janela das últimas 5 amostras de MOS
 * - Detecta degradação progressiva via slope (regressão linear simples)
 * - Emite toast preventivo quando slope < threshold antes de atingir "poor"
 *
 * @param currentMos MOS atual reportado pelo monitor (null = sem dados)
 * @param enabled    Habilita análise (somente durante chamada ativa)
 */
export function useQualityTrendAnalyzer(currentMos: number | null, enabled: boolean) {
  const samplesRef = useRef<MosSample[]>([]);
  const warnedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      samplesRef.current = [];
      warnedRef.current = false;
      return;
    }
    if (currentMos === null || !Number.isFinite(currentMos)) return;

    const now = Date.now();
    samplesRef.current.push({ mos: currentMos, t: now });
    if (samplesRef.current.length > 5) samplesRef.current.shift();

    if (samplesRef.current.length < 5) return;

    // Regressão linear simples: slope = Σ((x-x̄)(y-ȳ)) / Σ(x-x̄)²
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

    // Degradação: slope ≤ -0.15 por amostra E ainda não está em "poor" (>=3.6)
    const stillAcceptable = currentMos >= 3.6;
    const degrading = slope <= -0.15 && stillAcceptable;

    if (degrading && !warnedRef.current) {
      warnedRef.current = true;
      log.warn('Qualidade degradando', { slope: slope.toFixed(3), mos: currentMos });
      toast.warning('Qualidade da chamada degradando', {
        description: 'Verifique sua conexão de internet — possível queda iminente.',
        duration: 6000,
      });
    } else if (slope > -0.05) {
      // Recuperou — permite novo aviso futuro
      warnedRef.current = false;
    }
  }, [currentMos, enabled]);
}
