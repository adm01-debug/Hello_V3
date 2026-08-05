/**
 * Utilitários para scoring de tentativas outbound e análise de melhor janela de contato.
 * Usado pelo Predictive Dialer e pelo painel de Outbound Compliance.
 */
import { safeToFixed } from '@/lib/safe-number';

export type Recommendation = 'block' | 'defer' | 'low_priority' | 'normal' | 'high_priority';

export interface EngagementPattern {
  best_hour: number | null;
  best_day_of_week: number | null;
  answer_rate: number;
  total_attempts: number;
}

export interface ScoreInput {
  inDNC: boolean;
  withinHours: boolean;
  pattern: EngagementPattern | null;
  now?: Date;
}

export interface ScoreResult {
  score: number;
  recommendation: Recommendation;
  factors: string[];
}

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function computeAttemptScore({ inDNC, withinHours, pattern, now = new Date() }: ScoreInput): ScoreResult {
  const factors: string[] = [];

  if (inDNC) {
    return { score: 0, recommendation: 'block', factors: ['Número na lista DNC'] };
  }

  let score = 0.5;
  if (!withinHours) {
    score *= 0.1;
    factors.push('Fora do horário permitido');
  }

  if (pattern && pattern.total_attempts >= 3) {
    score = 0.3 + pattern.answer_rate * 0.4;
    factors.push(`Histórico: ${(pattern.answer_rate * 100).toFixed(1)}% atendimento`);

    const currentHour = now.getHours();
    const currentDay = now.getDay();

    if (pattern.best_hour !== null && Math.abs(currentHour - pattern.best_hour) <= 1) {
      score += 0.2;
      factors.push(`Janela ótima (${pattern.best_hour}h)`);
    }
    if (pattern.best_day_of_week !== null && currentDay === pattern.best_day_of_week) {
      score += 0.1;
      factors.push(`Dia ideal: ${DAY_NAMES[pattern.best_day_of_week]}`);
    }
  } else {
    factors.push('Histórico insuficiente');
  }

  score = Math.max(0, Math.min(1, score));
  const recommendation: Recommendation =
    score >= 0.7 ? 'high_priority'
    : score >= 0.4 ? 'normal'
    : score >= 0.15 ? 'low_priority'
    : 'defer';

  return { score: safeToFixed(score, 3), recommendation, factors };
}

export function formatBestWindow(pattern: EngagementPattern | null): string {
  if (!pattern || pattern.total_attempts < 3) return 'Sem histórico';
  const parts: string[] = [];
  if (pattern.best_hour !== null) parts.push(`${pattern.best_hour}h`);
  if (pattern.best_day_of_week !== null) parts.push(DAY_NAMES[pattern.best_day_of_week]);
  return parts.length > 0 ? parts.join(' • ') : 'Indeterminado';
}

export function recommendationLabel(rec: Recommendation): string {
  return ({
    block: 'Bloquear',
    defer: 'Adiar',
    low_priority: 'Baixa prioridade',
    normal: 'Normal',
    high_priority: 'Alta prioridade',
  })[rec];
}

export function recommendationColor(rec: Recommendation): string {
  return ({
    block: 'destructive',
    defer: 'secondary',
    low_priority: 'outline',
    normal: 'default',
    high_priority: 'default',
  })[rec];
}
