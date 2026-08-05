import { describe, it, expect } from 'vitest';
import { computeAttemptScore, formatBestWindow, recommendationLabel, type EngagementPattern } from '@/lib/outbound-scoring';

describe('outbound-scoring', () => {
  it('bloqueia números em DNC com score 0', () => {
    const r = computeAttemptScore({ inDNC: true, withinHours: true, pattern: null });
    expect(r.score).toBe(0);
    expect(r.recommendation).toBe('block');
    expect(r.factors[0]).toMatch(/DNC/);
  });

  it('penaliza fortemente fora do horário permitido', () => {
    const r = computeAttemptScore({ inDNC: false, withinHours: false, pattern: null });
    expect(r.score).toBeLessThan(0.1);
    expect(r.recommendation).toBe('defer');
  });

  it('aplica score base sem histórico suficiente', () => {
    const r = computeAttemptScore({ inDNC: false, withinHours: true, pattern: { best_hour: null, best_day_of_week: null, answer_rate: 0, total_attempts: 1 } });
    expect(r.score).toBe(0.5);
    expect(r.recommendation).toBe('normal');
  });

  it('eleva score quando hora atual coincide com melhor hora', () => {
    const now = new Date();
    const pattern: EngagementPattern = {
      best_hour: now.getHours(),
      best_day_of_week: null,
      answer_rate: 0.6,
      total_attempts: 10,
    };
    const r = computeAttemptScore({ inDNC: false, withinHours: true, pattern, now });
    // base = 0.3 + 0.6*0.4 = 0.54 + 0.2 (hora) = 0.74
    expect(r.score).toBeGreaterThanOrEqual(0.7);
    expect(r.recommendation).toBe('high_priority');
  });

  it('combina hora e dia ideais', () => {
    const now = new Date();
    const pattern: EngagementPattern = {
      best_hour: now.getHours(),
      best_day_of_week: now.getDay(),
      answer_rate: 0.8,
      total_attempts: 20,
    };
    const r = computeAttemptScore({ inDNC: false, withinHours: true, pattern, now });
    // 0.3 + 0.8*0.4 + 0.2 + 0.1 = 0.92
    expect(r.score).toBeGreaterThan(0.85);
    expect(r.recommendation).toBe('high_priority');
  });

  it('formata melhor janela legível', () => {
    expect(formatBestWindow(null)).toBe('Sem histórico');
    expect(formatBestWindow({ best_hour: 14, best_day_of_week: 2, answer_rate: 0.5, total_attempts: 5 })).toBe('14h • Terça');
    expect(formatBestWindow({ best_hour: null, best_day_of_week: null, answer_rate: 0.5, total_attempts: 5 })).toBe('Indeterminado');
  });

  it('mapeia recomendações para labels PT-BR', () => {
    expect(recommendationLabel('block')).toBe('Bloquear');
    expect(recommendationLabel('high_priority')).toBe('Alta prioridade');
    expect(recommendationLabel('defer')).toBe('Adiar');
  });
});
