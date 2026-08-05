import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useScorecards } from '../useScorecards';

const tplRow = { id: 't1', name: 'Default', description: null, is_active: true };
const critRow = { id: 'cr1', template_id: 't1', label: 'Tone', description: null, weight: 1, max_score: 5, display_order: 1 };
const scRow = { id: 'sc1', call_session_id: 'call1', template_id: 't1', agent_name: 'Ana', total_score: 4, max_total: 5, status: 'draft', ai_generated: false, feedback: null, created_at: '' };
const respRow = { id: 'r1', scorecard_id: 'sc1', criterion_id: 'cr1', score: 4, comment: null };

const state = {
  scorecards: [scRow] as unknown[],
  invokeError: null as unknown,
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      const builder: Record<string, unknown> = {};
      builder.select = vi.fn(() => builder);
      if (table === 'scorecard_templates') {
        builder.eq = vi.fn(() => Promise.resolve({ data: [tplRow], error: null }));
      } else if (table === 'scorecard_criteria') {
        builder.order = vi.fn(() => Promise.resolve({ data: [critRow], error: null }));
      } else if (table === 'call_scorecards') {
        builder.eq = vi.fn(() => Promise.resolve({ data: state.scorecards, error: null }));
      } else {
        // scorecard_responses
        builder.in = vi.fn(() => Promise.resolve({ data: [respRow], error: null }));
      }
      return builder;
    }),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: { ok: true }, error: state.invokeError })),
    },
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/logger', () => {
  const mk = () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() });
  return { logger: { create: vi.fn(mk), ...mk() } };
});

beforeEach(() => {
  state.scorecards = [scRow];
  state.invokeError = null;
  vi.clearAllMocks();
});

describe('useScorecards', () => {
  it('loads templates and criteria without callSessionId', async () => {
    const { result } = renderHook(() => useScorecards());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.templates.length).toBe(1);
    expect(result.current.criteria.length).toBe(1);
    expect(result.current.scorecards.length).toBe(0);
  });

  it('loads scorecards and responses with callSessionId', async () => {
    const { result } = renderHook(() => useScorecards('call1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.scorecards.length).toBe(1);
    expect(result.current.responses.length).toBe(1);
  });

  it('clears responses when no scorecards', async () => {
    state.scorecards = [];
    const { result } = renderHook(() => useScorecards('call1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.scorecards.length).toBe(0);
    expect(result.current.responses.length).toBe(0);
  });

  it('generateAIScorecard returns null without callSessionId', async () => {
    const { result } = renderHook(() => useScorecards());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let out: unknown = 'x';
    await act(async () => { out = await result.current.generateAIScorecard('t1'); });
    expect(out).toBeNull();
  });

  it('generateAIScorecard success', async () => {
    const { result } = renderHook(() => useScorecards('call1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    let out: unknown;
    await act(async () => { out = await result.current.generateAIScorecard('t1'); });
    expect(out).toEqual({ ok: true });
    const { toast } = await import('sonner');
    expect(toast.success).toHaveBeenCalledWith('Avaliação gerada pela IA');
  });

  it('generateAIScorecard error', async () => {
    state.invokeError = new Error('invoke fail');
    const { result } = renderHook(() => useScorecards('call1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    let out: unknown = 'x';
    await act(async () => { out = await result.current.generateAIScorecard('t1'); });
    expect(out).toBeNull();
    const { toast } = await import('sonner');
    expect(toast.error).toHaveBeenCalledWith('Erro ao gerar avaliação');
  });

  it('refresh re-loads', async () => {
    const { result } = renderHook(() => useScorecards('call1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.refresh(); });
    expect(result.current.scorecards.length).toBe(1);
  });
});
