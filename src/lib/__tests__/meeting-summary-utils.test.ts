import { describe, it, expect } from 'vitest';
import {
  isValidActionItem,
  isValidParticipantSentiment,
  serializeSummaryAsText,
} from '../meeting-summary-utils';
import type { MeetingSummary } from '@/hooks/useMeetingSummary';

describe('isValidActionItem', () => {
  it('aceita item válido', () => {
    expect(
      isValidActionItem({ description: 'Enviar proposta', priority: 'high' })
    ).toBe(true);
  });
  it('rejeita prioridade inválida', () => {
    expect(isValidActionItem({ description: 'x', priority: 'urgent' })).toBe(false);
  });
  it('rejeita sem descrição', () => {
    expect(isValidActionItem({ priority: 'low' })).toBe(false);
    expect(isValidActionItem({ description: '', priority: 'low' })).toBe(false);
  });
  it('rejeita null/string', () => {
    expect(isValidActionItem(null)).toBe(false);
    expect(isValidActionItem('foo')).toBe(false);
  });
});

describe('isValidParticipantSentiment', () => {
  it('aceita objeto válido', () => {
    expect(
      isValidParticipantSentiment({ speaker: 'Agente', sentiment: 'positive', score: 8.5 })
    ).toBe(true);
  });
  it('rejeita score fora do range', () => {
    expect(
      isValidParticipantSentiment({ speaker: 'x', sentiment: 'neutral', score: 11 })
    ).toBe(false);
    expect(
      isValidParticipantSentiment({ speaker: 'x', sentiment: 'neutral', score: -1 })
    ).toBe(false);
  });
  it('rejeita sentimento inválido', () => {
    expect(
      isValidParticipantSentiment({ speaker: 'x', sentiment: 'angry', score: 5 })
    ).toBe(false);
  });
});

describe('serializeSummaryAsText', () => {
  const baseSummary: MeetingSummary = {
    id: '1',
    call_session_id: 'cs1',
    summary: 'Cliente interessado no plano Pro.',
    key_points: ['Demo agendada', 'Orçamento aprovado'],
    action_items: [
      { description: 'Enviar contrato', owner: 'João', priority: 'high', due_suggestion: 'amanhã' },
      { description: 'Agendar onboarding', priority: 'medium' },
    ],
    decisions: ['Plano Pro escolhido'],
    next_steps: ['Reunião dia 20'],
    participants_sentiment: [
      { speaker: 'Cliente', sentiment: 'positive', score: 8.2 },
    ],
    topics_discussed: ['pricing'],
    follow_up_required: true,
    follow_up_reason: 'Aguardando aprovação financeira',
    ai_model: 'google/gemini-2.5-flash',
    ai_confidence: 0.92,
    generated_at: '2026-04-17T00:00:00Z',
    edited: false,
    edited_content: null,
    edited_by: null,
    edited_at: null,
    shared_with: [],
    status: 'completed',
    error_message: null,
    created_at: '2026-04-17T00:00:00Z',
    updated_at: '2026-04-17T00:00:00Z',
  };

  it('inclui todas as seções', () => {
    const text = serializeSummaryAsText(baseSummary);
    expect(text).toContain('# Resumo da Reunião');
    expect(text).toContain('## Resumo Executivo');
    expect(text).toContain('Cliente interessado');
    expect(text).toContain('## Pontos-chave');
    expect(text).toContain('- Demo agendada');
    expect(text).toContain('## Itens de Ação');
    expect(text).toContain('[HIGH] (João) Enviar contrato — prazo: amanhã');
    expect(text).toContain('[MEDIUM] Agendar onboarding');
    expect(text).toContain('## Decisões');
    expect(text).toContain('## Próximos Passos');
    expect(text).toContain('## Sentimento por Participante');
    expect(text).toContain('Cliente: positive (8.2)');
    expect(text).toContain('## Follow-up Necessário');
    expect(text).toContain('Aguardando aprovação financeira');
  });

  it('omite seções vazias', () => {
    const empty: MeetingSummary = {
      ...baseSummary,
      summary: null,
      key_points: [],
      action_items: [],
      decisions: [],
      next_steps: [],
      participants_sentiment: [],
      follow_up_required: false,
    };
    const text = serializeSummaryAsText(empty);
    expect(text).not.toContain('## Resumo Executivo');
    expect(text).not.toContain('## Pontos-chave');
    expect(text).not.toContain('## Follow-up');
    expect(text).toContain('# Resumo da Reunião');
  });
});
