/**
 * Utilitários puros para Real-Time Agent Assist.
 * Sem efeitos colaterais — fáceis de testar.
 */

export type IntentType =
  | 'objection'
  | 'technical_question'
  | 'discount_request'
  | 'buying_signal'
  | 'churn_risk'
  | 'compliance_violation'
  | 'sentiment_alert';

export interface MinimalSignal {
  intent: string;
  confidence: number;
  source: string;
  metadata?: Record<string, unknown>;
}

const INTENT_PRIORITY: Record<string, number> = {
  compliance_violation: 100,
  churn_risk: 90,
  objection: 80,
  buying_signal: 75,
  discount_request: 60,
  technical_question: 50,
  sentiment_alert: 40,
};

export const INTENT_LABELS: Record<string, string> = {
  objection: 'Objeção',
  technical_question: 'Pergunta técnica',
  discount_request: 'Pedido de desconto',
  buying_signal: 'Sinal de compra',
  churn_risk: 'Risco de churn',
  compliance_violation: 'Compliance',
  sentiment_alert: 'Alerta de sentimento',
};

export const INTENT_COLORS: Record<string, string> = {
  compliance_violation: 'destructive',
  churn_risk: 'destructive',
  objection: 'warning',
  discount_request: 'warning',
  buying_signal: 'success',
  technical_question: 'default',
  sentiment_alert: 'secondary',
};

/** Ordena sinais por (prioridade do intent × confiança) descendente. */
export function rankSignals<T extends MinimalSignal>(signals: T[]): T[] {
  return [...signals].sort((a, b) => {
    const ap = (INTENT_PRIORITY[a.intent] ?? 0) * (a.confidence || 0.5);
    const bp = (INTENT_PRIORITY[b.intent] ?? 0) * (b.confidence || 0.5);
    return bp - ap;
  });
}

/** Match de keywords case-insensitive em texto livre. */
export function matchesKeywords(text: string, keywords: string[]): boolean {
  if (!text || !Array.isArray(keywords) || keywords.length === 0) return false;
  const lower = text.toLowerCase();
  return keywords.some((kw) => kw && lower.includes(kw.toLowerCase()));
}

/** Janela de contexto recente para envio à IA (últimas N falas). */
export function buildRecentContext(
  transcripts: Array<{ speaker: string; text: string }>,
  lastN: number = 8
): string {
  return transcripts
    .slice(-lastN)
    .map((t) => `[${t.speaker}] ${t.text}`)
    .join('\n');
}

/** Deduplica sinais por (intent + trigger_text similar) numa janela curta. */
export function dedupeSignals<T extends { intent: string; trigger_text: string | null; created_at: string }>(
  signals: T[],
  windowSeconds: number = 30
): T[] {
  const seen = new Map<string, T>();
  for (const s of signals) {
    const key = `${s.intent}::${(s.trigger_text || '').slice(0, 50).toLowerCase()}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, s);
      continue;
    }
    const dt =
      Math.abs(new Date(s.created_at).getTime() - new Date(existing.created_at).getTime()) / 1000;
    if (dt > windowSeconds) {
      seen.set(key, s);
    }
  }
  return Array.from(seen.values());
}

/** Calcula taxa de aceitação de sinais (was_used / total). */
export function calculateAcceptanceRate(
  signals: Array<{ was_used: boolean }>
): number {
  if (signals.length === 0) return 0;
  const used = signals.filter((s) => s.was_used).length;
  return Math.round((used / signals.length) * 10000) / 100;
}

/** Agrega contagem por intent. */
export function countByIntent(signals: Array<{ intent: string }>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of signals) {
    counts[s.intent] = (counts[s.intent] ?? 0) + 1;
  }
  return counts;
}
