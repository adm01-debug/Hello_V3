import { describe, it, expect } from 'vitest';
import {
  rankSignals,
  matchesKeywords,
  buildRecentContext,
  dedupeSignals,
  calculateAcceptanceRate,
  countByIntent,
  INTENT_LABELS,
} from '../agent-assist-utils';

describe('agent-assist-utils', () => {
  describe('rankSignals', () => {
    it('ordena por prioridade × confiança', () => {
      const signals = [
        { intent: 'sentiment_alert', confidence: 0.9, source: 'a' },
        { intent: 'compliance_violation', confidence: 0.5, source: 'b' },
        { intent: 'objection', confidence: 0.8, source: 'c' },
      ];
      const ranked = rankSignals(signals);
      expect(ranked[0].intent).toBe('compliance_violation');
      expect(ranked[1].intent).toBe('objection');
    });

    it('lida com array vazio', () => {
      expect(rankSignals([])).toEqual([]);
    });

    it('intents desconhecidos vão para o fim', () => {
      const ranked = rankSignals([
        { intent: 'unknown', confidence: 0.99, source: 'a' },
        { intent: 'objection', confidence: 0.4, source: 'b' },
      ]);
      expect(ranked[0].intent).toBe('objection');
    });
  });

  describe('matchesKeywords', () => {
    it('detecta keyword case-insensitive', () => {
      expect(matchesKeywords('O preço está MUITO ALTO', ['caro', 'preço alto'])).toBe(true);
    });

    it('retorna false para texto vazio', () => {
      expect(matchesKeywords('', ['teste'])).toBe(false);
    });

    it('retorna false para keywords vazias', () => {
      expect(matchesKeywords('algum texto', [])).toBe(false);
    });

    it('ignora keywords nulas/vazias dentro do array', () => {
      expect(matchesKeywords('teste de algo', ['', 'algo'])).toBe(true);
    });
  });

  describe('buildRecentContext', () => {
    it('formata últimas N falas', () => {
      const transcripts = [
        { speaker: 'agent', text: 'olá' },
        { speaker: 'customer', text: 'oi' },
        { speaker: 'agent', text: 'como posso ajudar' },
      ];
      const ctx = buildRecentContext(transcripts, 2);
      expect(ctx).toContain('[customer] oi');
      expect(ctx).toContain('[agent] como posso ajudar');
      expect(ctx).not.toContain('olá');
    });

    it('retorna string vazia para array vazio', () => {
      expect(buildRecentContext([])).toBe('');
    });
  });

  describe('dedupeSignals', () => {
    it('remove duplicatas dentro da janela', () => {
      const now = new Date('2026-01-01T10:00:00Z').getTime();
      const signals = [
        { intent: 'objection', trigger_text: 'caro', created_at: new Date(now).toISOString() },
        { intent: 'objection', trigger_text: 'caro', created_at: new Date(now + 5000).toISOString() },
      ];
      expect(dedupeSignals(signals, 30)).toHaveLength(1);
    });

    it('mantém duplicatas fora da janela', () => {
      const now = new Date('2026-01-01T10:00:00Z').getTime();
      const signals = [
        { intent: 'objection', trigger_text: 'caro', created_at: new Date(now).toISOString() },
        { intent: 'objection', trigger_text: 'caro', created_at: new Date(now + 60000).toISOString() },
      ];
      expect(dedupeSignals(signals, 30)).toHaveLength(2);
    });

    it('lida com trigger_text null', () => {
      const signals = [
        { intent: 'objection', trigger_text: null, created_at: new Date().toISOString() },
      ];
      expect(dedupeSignals(signals)).toHaveLength(1);
    });
  });

  describe('calculateAcceptanceRate', () => {
    it('calcula percentual com 2 casas', () => {
      expect(calculateAcceptanceRate([
        { was_used: true }, { was_used: false }, { was_used: true },
      ])).toBeCloseTo(66.67, 1);
    });

    it('retorna 0 para array vazio', () => {
      expect(calculateAcceptanceRate([])).toBe(0);
    });

    it('retorna 100 quando todos foram usados', () => {
      expect(calculateAcceptanceRate([{ was_used: true }, { was_used: true }])).toBe(100);
    });
  });

  describe('countByIntent', () => {
    it('agrega contagem por intent', () => {
      const counts = countByIntent([
        { intent: 'objection' },
        { intent: 'objection' },
        { intent: 'buying_signal' },
      ]);
      expect(counts.objection).toBe(2);
      expect(counts.buying_signal).toBe(1);
    });

    it('retorna objeto vazio para array vazio', () => {
      expect(countByIntent([])).toEqual({});
    });
  });

  describe('INTENT_LABELS', () => {
    it('contém todos intents principais em PT-BR', () => {
      expect(INTENT_LABELS.objection).toBe('Objeção');
      expect(INTENT_LABELS.compliance_violation).toBe('Compliance');
      expect(INTENT_LABELS.churn_risk).toBe('Risco de churn');
    });
  });
});
