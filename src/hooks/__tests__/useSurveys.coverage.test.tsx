import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSurveys, type SurveyResponse } from '../useSurveys';

const invokeMock = vi.fn();

interface ThenableBuilder {
  select: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  then: (resolve: (v: { data: unknown; error: unknown }) => unknown) => Promise<unknown>;
}

let queryResult: { data: unknown; error: unknown } = { data: [], error: null };

function makeBuilder(): ThenableBuilder {
  const builder: Partial<ThenableBuilder> = {};
  builder.select = vi.fn(() => builder as ThenableBuilder);
  builder.order = vi.fn(() => builder as ThenableBuilder);
  builder.limit = vi.fn(() => builder as ThenableBuilder);
  builder.eq = vi.fn(() => builder as ThenableBuilder);
  builder.then = (resolve) => Promise.resolve(resolve(queryResult));
  return builder as ThenableBuilder;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => makeBuilder()),
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(), warn: vi.fn(), info: vi.fn(),
    create: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }),
  },
}));

import { toast } from 'sonner';

const sample: SurveyResponse[] = [
  { id: '1', survey_id: 's1', account_id: 'a1', contact_id: null, call_session_id: null, score: 10, category: null, answers: {}, free_text_feedback: null, channel: 'email', submitted_at: '2026-01-01' },
  { id: '2', survey_id: 's1', account_id: 'a1', contact_id: null, call_session_id: null, score: 3, category: null, answers: {}, free_text_feedback: null, channel: 'sms', submitted_at: '2026-01-02' },
  { id: '3', survey_id: 's1', account_id: 'a1', contact_id: null, call_session_id: null, score: null, category: null, answers: {}, free_text_feedback: null, channel: 'email', submitted_at: '2026-01-03' },
];

describe('useSurveys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResult = { data: sample, error: null };
    invokeMock.mockResolvedValue({ data: { ok: true }, error: null });
  });

  it('carrega respostas e calcula nps', async () => {
    const { result } = renderHook(() => useSurveys('a1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.responses.length).toBe(3);
    // 1 promoter (10), 1 detractor (3), valid=2 -> 0
    expect(result.current.npsScore).toBe(0);
  });

  it('npsScore null quando sem scores válidos', async () => {
    queryResult = { data: [], error: null };
    const { result } = renderHook(() => useSurveys());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.npsScore).toBeNull();
  });

  it('trata erro de carregamento', async () => {
    queryResult = { data: null, error: { message: 'boom' } };
    const { result } = renderHook(() => useSurveys());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(toast.error).toHaveBeenCalledWith('Falha ao carregar respostas');
  });

  it('envia pesquisa com sucesso', async () => {
    const { result } = renderHook(() => useSurveys());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.sendSurvey({ survey_id: 's1', account_id: 'a1' });
    });
    expect(invokeMock).toHaveBeenCalledWith('send-survey', { body: { survey_id: 's1', account_id: 'a1' } });
    expect(toast.success).toHaveBeenCalledWith('Pesquisa enviada');
  });

  it('trata erro ao enviar pesquisa', async () => {
    invokeMock.mockResolvedValueOnce({ data: null, error: { message: 'fail' } });
    const { result } = renderHook(() => useSurveys());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.sendSurvey({ survey_id: 's1' });
    });
    expect(toast.error).toHaveBeenCalledWith('Falha ao enviar pesquisa');
  });
});
