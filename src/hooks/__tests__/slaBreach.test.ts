import { describe, it, expect } from 'vitest';
import { describeSlaBreach, formatDelay } from '../useSLA';

const NOW = new Date('2026-11-26T12:00:00Z').getTime();

describe('describeSlaBreach', () => {
  it('sem primeira resposta e prazo vencido: culpa a primeira resposta', () => {
    const r = describeSlaBreach(
      {
        sla_first_response_due_at: '2026-11-26T11:00:00Z',
        sla_resolution_due_at: '2026-11-27T12:00:00Z',
        first_response_at: null,
        resolved_at: null,
      },
      NOW,
    );
    expect(r.kind).toBe('first_response');
    expect(r.delayMinutes).toBe(60);
    expect(r.dueAt).toBe('2026-11-26T11:00:00Z');
  });

  it('primeira resposta dentro do prazo mas resolucao atrasada', () => {
    const r = describeSlaBreach(
      {
        sla_first_response_due_at: '2026-11-26T11:00:00Z',
        sla_resolution_due_at: '2026-11-26T11:30:00Z',
        first_response_at: '2026-11-26T10:55:00Z',
        resolved_at: '2026-11-26T13:30:00Z',
      },
      NOW,
    );
    expect(r.kind).toBe('resolution');
    expect(r.delayMinutes).toBe(120);
  });

  it('resolucao ainda em aberto conta o atraso contra agora', () => {
    const r = describeSlaBreach(
      {
        sla_first_response_due_at: '2026-11-26T09:00:00Z',
        sla_resolution_due_at: '2026-11-26T10:00:00Z',
        first_response_at: '2026-11-26T08:30:00Z',
        resolved_at: null,
      },
      NOW,
    );
    expect(r.kind).toBe('resolution');
    expect(r.delayMinutes).toBe(120);
  });

  it('marcada como violada mas sem prazo estourado calculavel nao inventa atraso', () => {
    const r = describeSlaBreach(
      {
        sla_first_response_due_at: null,
        sla_resolution_due_at: null,
        first_response_at: null,
        resolved_at: null,
      },
      NOW,
    );
    expect(r.kind).toBe('unknown');
    expect(r.delayMinutes).toBeNull();
    expect(r.dueAt).toBeNull();
  });

  it('prazo exatamente cumprido nao conta como atraso', () => {
    const r = describeSlaBreach(
      {
        sla_first_response_due_at: '2026-11-26T10:00:00Z',
        sla_resolution_due_at: '2026-11-26T11:00:00Z',
        first_response_at: '2026-11-26T10:00:00Z',
        resolved_at: '2026-11-26T10:00:00Z',
      },
      NOW,
    );
    expect(r.kind).toBe('unknown');
    expect(r.delayMinutes).toBeNull();
  });
});

describe('formatDelay', () => {
  it('mostra minutos, horas e dias', () => {
    expect(formatDelay(45)).toBe('45 min');
    expect(formatDelay(150)).toBe('2 h');
    expect(formatDelay(60 * 26)).toBe('1 d 2 h');
    expect(formatDelay(60 * 48)).toBe('2 d');
  });
});