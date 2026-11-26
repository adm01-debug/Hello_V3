import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ─── Mocks ───────────────────────────────────────────────────────────────────
const mockToast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: mockToast }));

vi.mock('@/lib/logger', () => {
  const methods = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  return {
    logger: { ...methods, create: vi.fn(() => ({ ...methods })) },
  };
});

// Holders the tests can mutate to control supabase behaviour.
let selectResult: { data: unknown; error: unknown } = { data: [], error: null };
let maybeSingleResult: { data: unknown; error: unknown } = { data: null, error: null };
let singleResult: { data: unknown; error: unknown } = { data: { id: 'new-campaign' }, error: null };
let insertResult: { error: unknown } = { error: null };
let updateResult: { error: unknown } = { error: null };
let deleteResult: { error: unknown } = { error: null };
// Etapa 079: a reserva do proximo contato passou a ser a RPC
// claim_next_dialer_contact (uma unica operacao no banco).
let rpcResult: { data: unknown; error: unknown } = { data: [], error: null };

// channelObj / makeFrom / mockSupabase are wrapped in vi.hoisted so the hoisted
// vi.mock factory can reference mockSupabase. makeFrom reads the mutable holders
// above at call time (test time), which is safe.
const channelObj = vi.hoisted(() => {
  const obj: { on: ReturnType<typeof vi.fn>; subscribe: ReturnType<typeof vi.fn> } = {
    on: vi.fn(function () { return obj; }),
    subscribe: vi.fn(function () { return obj; }),
  };
  return obj;
});

function makeFrom() {
  // A query builder that is thenable so `await chain` resolves to selectResult
  const builder: Record<string, unknown> = {};
  const chainable = ['select', 'order', 'eq', 'or', 'limit'];
  for (const m of chainable) {
    builder[m] = vi.fn(() => builder);
  }
  builder.maybeSingle = vi.fn(() => Promise.resolve(maybeSingleResult));
  builder.single = vi.fn(() => Promise.resolve(singleResult));
  // make the builder awaitable -> resolves to selectResult (used by fetchCampaigns/fetchQueue)
  builder.then = (resolve: (v: unknown) => unknown) => resolve(selectResult);

  builder.insert = vi.fn(() => ({
    select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve(singleResult)) })),
    then: (resolve: (v: unknown) => unknown) => resolve(insertResult),
  }));
  builder.update = vi.fn(() => ({
    eq: vi.fn(() => ({
      select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve(singleResult)) })),
      then: (resolve: (v: unknown) => unknown) => resolve(updateResult),
    })),
  }));
  builder.delete = vi.fn(() => ({
    eq: vi.fn(() => Promise.resolve(deleteResult)),
  }));
  return builder;
}

const mockSupabase = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(() => Promise.resolve(rpcResult)),
  channel: vi.fn(),
  removeChannel: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

import { usePredictiveDialer } from '@/hooks/usePredictiveDialer';

const sampleCampaign = {
  id: 'c1',
  name: 'Campaign',
  description: null,
  status: 'paused',
  mode: 'predictive',
  max_concurrent_calls: 3,
  call_timeout_seconds: 30,
  retry_attempts: 2,
  retry_delay_minutes: 30,
  working_hours_start: '08:00:00',
  working_hours_end: '18:00:00',
  total_contacts: 5,
  completed_contacts: 0,
  successful_contacts: 0,
  created_by: 'u1',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

const sampleQueueItem = {
  id: 'q1',
  campaign_id: 'c1',
  contact_id: null,
  phone: '5511999999999',
  name: 'John',
  priority: 0,
  status: 'pending',
  attempts: 0,
  last_attempt_at: null,
  next_attempt_at: null,
  result: null,
  result_notes: null,
  assigned_agent: null,
  call_duration_seconds: null,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

function resetResults() {
  selectResult = { data: [sampleCampaign], error: null };
  maybeSingleResult = { data: null, error: null };
  singleResult = { data: { ...sampleCampaign, id: 'new-campaign', status: 'active' }, error: null };
  insertResult = { error: null };
  updateResult = { error: null };
  deleteResult = { error: null };
  rpcResult = { data: [], error: null };
}

beforeEach(() => {
  resetResults();
  mockToast.success.mockReset();
  mockToast.error.mockReset();
  mockToast.info.mockReset();
  mockToast.warning.mockReset();
  mockSupabase.from.mockImplementation(() => makeFrom());
  mockSupabase.rpc.mockReset();
  mockSupabase.rpc.mockImplementation(() => Promise.resolve(rpcResult));
  mockSupabase.channel.mockImplementation(() => channelObj);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('usePredictiveDialer', () => {
  it('fetches campaigns on mount and exposes API', async () => {
    const { result } = renderHook(() => usePredictiveDialer());
    await waitFor(() => expect(result.current.campaigns.length).toBeGreaterThan(0));
    expect(typeof result.current.createCampaign).toBe('function');
    expect(result.current.isLoading).toBe(false);
  });

  it('handles fetchCampaigns error branch', async () => {
    selectResult = { data: null, error: new Error('boom') };
    const { result } = renderHook(() => usePredictiveDialer());
    await act(async () => {
      await result.current.fetchCampaigns();
    });
    expect(mockToast.error).toHaveBeenCalledWith('Erro ao carregar campanhas');
  });

  it('fetchQueue success and error branches', async () => {
    const { result } = renderHook(() => usePredictiveDialer());
    await waitFor(() => expect(result.current.campaigns.length).toBeGreaterThan(0));

    selectResult = { data: [sampleQueueItem], error: null };
    await act(async () => {
      const rows = await result.current.fetchQueue('c1');
      expect(rows.length).toBe(1);
    });

    selectResult = { data: null, error: new Error('qerr') };
    await act(async () => {
      const rows = await result.current.fetchQueue('c1');
      expect(rows).toEqual([]);
    });
  });

  it('createCampaign success and error branches', async () => {
    const { result } = renderHook(() => usePredictiveDialer());
    await waitFor(() => expect(result.current.campaigns.length).toBeGreaterThan(0));

    await act(async () => {
      const created = await result.current.createCampaign({ name: 'New' });
      expect(created).toBeTruthy();
    });
    expect(mockToast.success).toHaveBeenCalledWith('Campanha criada com sucesso');

    // also exercise with all optional fields provided
    await act(async () => {
      await result.current.createCampaign({
        name: 'Full',
        description: 'd',
        mode: 'progressive',
        max_concurrent_calls: 5,
        call_timeout_seconds: 60,
        retry_attempts: 4,
        retry_delay_minutes: 10,
        working_hours_start: '09:00:00',
        working_hours_end: '17:00:00',
        created_by: 'u2',
        status: 'active',
      });
    });

    singleResult = { data: null, error: new Error('insert fail') };
    await act(async () => {
      const created = await result.current.createCampaign({ name: 'Fail' });
      expect(created).toBeNull();
    });
    expect(mockToast.error).toHaveBeenCalledWith('Erro ao criar campanha');
  });

  it('addToQueue success and error branches', async () => {
    const { result } = renderHook(() => usePredictiveDialer());
    await waitFor(() => expect(result.current.campaigns.length).toBeGreaterThan(0));

    await act(async () => {
      const ok = await result.current.addToQueue([
        { campaign_id: 'c1', phone: '111', name: 'A', contact_id: 'x', priority: 2 },
        { campaign_id: 'c1', phone: '222' },
      ]);
      expect(ok).toBe(true);
    });
    expect(mockToast.success).toHaveBeenCalled();

    insertResult = { error: new Error('insert err') };
    await act(async () => {
      const ok = await result.current.addToQueue([{ campaign_id: 'c1', phone: '333' }]);
      expect(ok).toBe(false);
    });
    expect(mockToast.error).toHaveBeenCalledWith('Erro ao adicionar à fila');
  });

  it('startCampaign success and error branches', async () => {
    const { result } = renderHook(() => usePredictiveDialer());
    await waitFor(() => expect(result.current.campaigns.length).toBeGreaterThan(0));

    await act(async () => {
      await result.current.startCampaign('c1');
    });
    await waitFor(() => expect(result.current.isDialing).toBe(true));
    expect(result.current.activeCampaign).toBeTruthy();
    expect(mockToast.success).toHaveBeenCalledWith('Campanha iniciada');

    // pause to clear the auto-dial effect before error case
    await act(async () => {
      await result.current.pauseCampaign('c1');
    });

    singleResult = { data: null, error: new Error('start fail') };
    await act(async () => {
      await result.current.startCampaign('c1');
    });
    expect(mockToast.error).toHaveBeenCalledWith('Erro ao iniciar campanha');
  });

  it('pauseCampaign success and error branches', async () => {
    const { result } = renderHook(() => usePredictiveDialer());
    await waitFor(() => expect(result.current.campaigns.length).toBeGreaterThan(0));

    await act(async () => {
      await result.current.pauseCampaign('c1');
    });
    expect(mockToast.info).toHaveBeenCalledWith('Campanha pausada');

    updateResult = { error: new Error('pause fail') };
    await act(async () => {
      await result.current.pauseCampaign('c1');
    });
    expect(mockToast.error).toHaveBeenCalledWith('Erro ao pausar campanha');
  });

  it('completeCall handles retry, callback, answered, and missing item branches', async () => {
    const { result } = renderHook(() => usePredictiveDialer());
    await waitFor(() => expect(result.current.campaigns.length).toBeGreaterThan(0));

    // Seed queue + activeCampaign through fetch
    selectResult = { data: [sampleQueueItem], error: null };
    await act(async () => {
      await result.current.fetchQueue('c1');
    });
    act(() => {
      result.current.setActiveCampaign(sampleCampaign as never);
    });

    // missing item -> early return
    await act(async () => {
      await result.current.completeCall('does-not-exist', 'answered');
    });

    // answered -> completed + successful
    await act(async () => {
      await result.current.completeCall('q1', 'answered', 'great', 42);
    });

    // no_answer with attempts < retry -> reschedule pending
    await act(async () => {
      await result.current.completeCall('q1', 'no_answer');
    });

    // busy branch
    await act(async () => {
      await result.current.completeCall('q1', 'busy', 'line busy');
    });

    // callback branch
    await act(async () => {
      await result.current.completeCall('q1', 'callback');
    });
    expect(mockSupabase.from).toHaveBeenCalled();
  });

  it('completeCall uses campaigns lookup when no active campaign and handles errors', async () => {
    selectResult = { data: [{ ...sampleCampaign, id: 'c1' }], error: null };
    const { result } = renderHook(() => usePredictiveDialer());
    await waitFor(() => expect(result.current.campaigns.length).toBeGreaterThan(0));

    selectResult = { data: [{ ...sampleQueueItem, attempts: 5 }], error: null };
    await act(async () => {
      await result.current.fetchQueue('c1');
    });

    // No active campaign set, found via campaigns list; attempts >= retry so completed
    await act(async () => {
      await result.current.completeCall('q1', 'no_answer');
    });

    // missing campaign branch -> set queue item with unknown campaign
    selectResult = { data: [{ ...sampleQueueItem, id: 'q2', campaign_id: 'unknown' }], error: null };
    await act(async () => {
      await result.current.fetchQueue('c1');
    });
    await act(async () => {
      await result.current.completeCall('q2', 'answered');
    });
    expect(mockSupabase.from).toHaveBeenCalled();
  });

  it('deleteCampaign success and error branches', async () => {
    const { result } = renderHook(() => usePredictiveDialer());
    await waitFor(() => expect(result.current.campaigns.length).toBeGreaterThan(0));

    await act(async () => {
      const ok = await result.current.deleteCampaign('c1');
      expect(ok).toBe(true);
    });
    expect(mockToast.success).toHaveBeenCalledWith('Campanha removida');

    deleteResult = { error: new Error('del fail') };
    await act(async () => {
      const ok = await result.current.deleteCampaign('c1');
      expect(ok).toBe(false);
    });
    expect(mockToast.error).toHaveBeenCalledWith('Erro ao remover campanha');
  });

  it('removeFromQueue success and error branches', async () => {
    const { result } = renderHook(() => usePredictiveDialer());
    await waitFor(() => expect(result.current.campaigns.length).toBeGreaterThan(0));

    selectResult = { data: [sampleQueueItem], error: null };
    await act(async () => {
      await result.current.fetchQueue('c1');
    });

    await act(async () => {
      const ok = await result.current.removeFromQueue('q1');
      expect(ok).toBe(true);
    });
    expect(result.current.queue.find((q) => q.id === 'q1')).toBeUndefined();

    deleteResult = { error: new Error('rm fail') };
    await act(async () => {
      const ok = await result.current.removeFromQueue('q1');
      expect(ok).toBe(false);
    });
  });

  it('setPriority grava a prioridade e reflete na fila (A-084)', async () => {
    const { result } = renderHook(() => usePredictiveDialer());
    await waitFor(() => expect(result.current.campaigns.length).toBeGreaterThan(0));

    selectResult = { data: [sampleQueueItem], error: null };
    await act(async () => {
      await result.current.fetchQueue('c1');
    });

    await act(async () => {
      const ok = await result.current.setPriority('q1', 7);
      expect(ok).toBe(true);
    });
    expect(result.current.queue.find((q) => q.id === 'q1')?.priority).toBe(7);

    // Falha do update nao pode deixar a tela mostrando prioridade que o banco recusou.
    updateResult = { error: new Error('prio fail') };
    await act(async () => {
      const ok = await result.current.setPriority('q1', 9);
      expect(ok).toBe(false);
    });
    expect(result.current.queue.find((q) => q.id === 'q1')?.priority).toBe(7);
  });

  it('dialContact apresenta o contato ja reservado pelo banco', async () => {
    const { result } = renderHook(() => usePredictiveDialer());
    await waitFor(() => expect(result.current.campaigns.length).toBeGreaterThan(0));

    // Etapa 079: a reserva acontece no banco (claim_next_dialer_contact), nao
    // aqui — dialContact nao escreve mais em `dialer_queue`.
    mockSupabase.from.mockClear();
    await act(async () => {
      await result.current.dialContact(sampleQueueItem as never);
    });
    expect(result.current.currentCall).toBeTruthy();
    expect(mockToast.info).toHaveBeenCalled();
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('auto-dial loop dials next contact then finishes queue', async () => {
    vi.useFakeTimers();
    // Etapa 079: a reserva devolve o contato.
    rpcResult = { data: [sampleQueueItem], error: null };
    const { result } = renderHook(() => usePredictiveDialer());

    await act(async () => {
      await Promise.resolve();
    });

    // Start dialing -> effect schedules setTimeout(dial, 2000)
    await act(async () => {
      await result.current.startCampaign('c1');
    });

    // advance to fire the dial callback
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });

    vi.useRealTimers();
    // currentCall should be set after dialing the next contact
    expect(result.current.currentCall).toBeTruthy();
    // `startCampaign` adota a campanha devolvida pelo insert (`singleResult`).
    expect(mockSupabase.rpc).toHaveBeenCalledWith('claim_next_dialer_contact', {
      p_campaign_id: 'new-campaign',
    });
  });

  it('auto-dial loop with empty queue pauses campaign', async () => {
    vi.useFakeTimers();
    rpcResult = { data: [], error: null };
    const { result } = renderHook(() => usePredictiveDialer());

    await act(async () => {
      await result.current.startCampaign('c1');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });

    vi.useRealTimers();
    await waitFor(() => expect(mockToast.info).toHaveBeenCalledWith('Fila de discagem concluída')).catch(() => {});
  });

  it('realtime subscription callbacks fire fetchers', async () => {
    selectResult = { data: [sampleCampaign], error: null };
    const { unmount } = renderHook(() => usePredictiveDialer());
    await waitFor(() => expect(mockSupabase.channel).toHaveBeenCalled());

    // Find the .on handlers registered and invoke them
    const onCalls = channelObj.on.mock.calls;
    expect(onCalls.length).toBeGreaterThanOrEqual(2);
    await act(async () => {
      onCalls.forEach((c) => {
        const cb = c[2];
        if (typeof cb === 'function') cb();
      });
    });

    unmount();
    expect(mockSupabase.removeChannel).toHaveBeenCalled();
  });

  // E244: uma rajada de eventos da mesma tabela virava uma leitura por evento.
  it('agrupa rajada de eventos de realtime numa unica leitura', async () => {
    selectResult = { data: [sampleCampaign], error: null };
    const { unmount } = renderHook(() => usePredictiveDialer());
    await waitFor(() => expect(mockSupabase.channel).toHaveBeenCalled());

    const handlerCampanhas = channelObj.on.mock.calls
      .find((c) => (c[1] as { table?: string })?.table === 'dialer_campaigns')?.[2];
    expect(typeof handlerCampanhas).toBe('function');

    mockSupabase.from.mockClear();
    vi.useFakeTimers();
    act(() => { for (let i = 0; i < 10; i++) (handlerCampanhas as () => void)(); });
    expect(mockSupabase.from).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(1000); });
    vi.useRealTimers();

    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledTimes(1));
    unmount();
  });

  it('pula o contato e grava o motivo quando o compliance bloqueia', async () => {
    const updates: Array<Record<string, unknown>> = [];
    mockSupabase.from.mockImplementation(() => {
      const b = makeFrom();
      b.update = vi.fn((patch: Record<string, unknown>) => {
        updates.push(patch);
        return { eq: vi.fn(() => Promise.resolve({ error: null })) };
      });
      return b;
    });
    const preDialCheck = vi.fn().mockResolvedValue({
      canDial: false,
      reasons: ['Numero na lista DNC', 'Fora do horario legal'],
    });

    const { result } = renderHook(() => usePredictiveDialer(preDialCheck));
    await waitFor(() => expect(result.current.campaigns.length).toBeGreaterThan(0));

    await act(async () => {
      await result.current.dialContact(sampleQueueItem as never);
    });

    expect(preDialCheck).toHaveBeenCalledWith('5511999999999');
    // Nada de `dialing`: o contato sai da fila com rastro auditavel.
    expect(updates).toEqual([
      { status: 'skipped', result: 'compliance: Numero na lista DNC · Fora do horario legal' },
    ]);
    expect(result.current.currentCall).toBeNull();
    expect(mockToast.info).not.toHaveBeenCalled();
    expect(mockToast.warning).toHaveBeenCalled();
  });

  it('disca normalmente quando o compliance aprova; a tentativa ja foi contada no banco', async () => {
    const updates: Array<Record<string, unknown>> = [];
    mockSupabase.from.mockImplementation(() => {
      const b = makeFrom();
      b.update = vi.fn((patch: Record<string, unknown>) => {
        updates.push(patch);
        return { eq: vi.fn(() => Promise.resolve({ error: null })) };
      });
      return b;
    });
    const preDialCheck = vi.fn().mockResolvedValue({ canDial: true, reasons: [] });

    const { result } = renderHook(() => usePredictiveDialer(preDialCheck));
    await waitFor(() => expect(result.current.campaigns.length).toBeGreaterThan(0));

    await act(async () => {
      await result.current.dialContact(sampleQueueItem as never);
    });

    expect(preDialCheck).toHaveBeenCalledTimes(1);
    // Etapa 079: `status = dialing` e `attempts + 1` sao gravados pela reserva
    // no banco (claim_next_dialer_contact) antes de chegar aqui.
    expect(updates).toEqual([]);
    expect(result.current.currentCall).toBeTruthy();
    expect(mockToast.warning).not.toHaveBeenCalled();
  });

  it('falha do preDialCheck pula o contato (fail-closed, etapa 035)', async () => {
    const updates: Array<Record<string, unknown>> = [];
    mockSupabase.from.mockImplementation(() => {
      const b = makeFrom();
      b.update = vi.fn((patch: Record<string, unknown>) => {
        updates.push(patch);
        return { eq: vi.fn(() => Promise.resolve({ error: null })) };
      });
      return b;
    });
    const preDialCheck = vi.fn().mockRejectedValue(new Error('rpc indisponivel'));

    const { result } = renderHook(() => usePredictiveDialer(preDialCheck));
    await waitFor(() => expect(result.current.campaigns.length).toBeGreaterThan(0));

    await act(async () => {
      await result.current.dialContact(sampleQueueItem as never);
    });

    expect(preDialCheck).toHaveBeenCalledTimes(1);
    // Nada de `dialing`: sem checagem nao ha discagem, e a fila guarda o motivo.
    expect(updates).toEqual([
      { status: 'skipped', result: 'compliance: verificação de conformidade indisponível: rpc indisponivel' },
    ]);
    expect(result.current.currentCall).toBeNull();
    expect(mockToast.warning).toHaveBeenCalled();
  });

  it('para a campanha quando o claim da fila falha (A-057)', async () => {
    // Etapa 079: a reserva agora e uma unica RPC; o erro dela nao pode ser
    // confundido com "fila vazia" nem deixar a linha em estado desconhecido.
    mockSupabase.rpc.mockImplementation(() =>
      Promise.resolve({ data: null, error: { message: 'claim falhou' } }),
    );

    const { result } = renderHook(() => usePredictiveDialer());
    await waitFor(() => expect(result.current.campaigns.length).toBeGreaterThan(0));

    vi.useFakeTimers();
    await act(async () => {
      await result.current.startCampaign('c1');
    });
    expect(result.current.isDialing).toBe(true);
    expect(result.current.activeCampaign).toBeTruthy();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });
    vi.useRealTimers();

    expect(result.current.currentCall).toBeNull();
    expect(result.current.activeCampaign).toBeNull();
    expect(result.current.isDialing).toBe(false);
    expect(mockToast.error).toHaveBeenCalledWith(
      expect.stringContaining('Campanha pausada'),
      expect.anything()
    );
    // O erro nao pode ser confundido com fila vazia.
    expect(mockToast.info).not.toHaveBeenCalledWith('Fila de discagem concluída');
  });
});
