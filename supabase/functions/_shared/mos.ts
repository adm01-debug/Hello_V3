/**
 * Fonte única dos limiares de MOS (escala 1–5, E-Model).
 *
 * Antes havia 3,5 em quatro arquivos e 3,6 em dois: a mesma chamada de 3,55
 * era "degradada" no mapa, "aceitável" no detector de tendência e "recuperada"
 * na simulação. Agora tudo passa por aqui.
 */

export const MOS_THRESHOLDS = {
  /** Abaixo disto a chamada é ruim (limiar clássico de MOS aceitável). */
  poor: 3.5,
  /** A partir disto a qualidade é boa. */
  good: 4.0,
  /** A partir disto a qualidade é excelente. */
  excellent: 4.3,
} as const;

export type MosLabel = 'poor' | 'fair' | 'good' | 'excellent' | 'unknown';

/**
 * Classifica um MOS. O antigo limite de 3,6 para "mediano" foi dobrado em
 * `poor` (3,5): uma nota só tem uma classificação, em qualquer tela.
 */
export function classifyMos(value: number | null | undefined): MosLabel {
  if (value == null || !Number.isFinite(value)) return 'unknown';
  if (value < MOS_THRESHOLDS.poor) return 'poor';
  if (value < MOS_THRESHOLDS.good) return 'fair';
  if (value < MOS_THRESHOLDS.excellent) return 'good';
  return 'excellent';
}

/** Verdadeiro quando a nota é considerada ruim (abaixo de 3,5). */
export function isPoorMos(value: number | null | undefined): boolean {
  return value != null && Number.isFinite(value) && value < MOS_THRESHOLDS.poor;
}