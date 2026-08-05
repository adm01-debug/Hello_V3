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

/**
 * Ordena sinais por prioridade do intent (peso dominante) × confiança (desempate).
 * Garante que intents críticos (compliance, churn) sempre liderem, independente
 * de uma confiança ligeiramente menor que sinais de menor severidade.
 */
 export function rankSignals<T extends MinimalSignal>(signals: T[]): T[] {
   return [...signals].sort((a, b) => {
     const pa = INTENT_PRIORITY[a.intent] ?? 0;
     const pb = INTENT_PRIORITY[b.intent] ?? 0;
     if (pa !== pb) return pb - pa;
     
     const ca = a.confidence ?? 0.5;
     const cb = b.confidence ?? 0.5;
     return cb - ca;
   });
 }

/**
 * Match flexível de keywords no texto. Para keywords compostas (várias palavras),
 * exige que TODAS as palavras-chave apareçam no texto (ordem livre), evitando
 * falsos negativos quando o texto reordena ou intercala termos.
 */
export function matchesKeywords(text: string, keywords: string[]): boolean {
  if (!text || !Array.isArray(keywords) || keywords.length === 0) return false;
  const lower = text.toLowerCase();
  return keywords.some((kw) => {
    if (!kw) return false;
    const tokens = kw.toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return false;
    return tokens.every((t) => lower.includes(t));
  });
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

/**
 * Deduplica sinais por (intent + trigger_text similar) dentro de uma janela curta.
 * Sinais com mesma chave SEPARADOS por mais de `windowSeconds` são preservados
 * — apenas duplicatas próximas no tempo (ruído da IA) são colapsadas.
 */
export function dedupeSignals<T extends { intent: string; trigger_text: string | null; created_at: string }>(
  signals: T[],
  windowSeconds: number = 30
): T[] {
  const buckets = new Map<string, T[]>();
  for (const s of signals) {
    const key = `${s.intent}::${(s.trigger_text || '').slice(0, 50).toLowerCase()}`;
    const list = buckets.get(key);
    if (!list) {
      buckets.set(key, [s]);
      continue;
    }
    const last = list[list.length - 1];
    const dt =
      Math.abs(new Date(s.created_at).getTime() - new Date(last.created_at).getTime()) / 1000;
    if (dt > windowSeconds) list.push(s);
  }
  return Array.from(buckets.values()).flat();
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
