import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const registerCallMock = vi.fn();
const finishCallMock = vi.fn();

vi.mock('../useBitrix', () => ({
  useBitrix: () => ({ registerCall: registerCallMock, finishCall: finishCallMock }),
}));

interface Chain {
  select: () => Chain; single: () => Chain; order: () => Chain; eq: () => Chain;
  limit: () => Chain; is: () => Chain; in: () => Chain; maybeSingle: () => Chain;
  then: (resolve: (v: unknown) => void) => void;
}

const escritasCallSessions: Array<Record<string, unknown>> = [];
let insertPayload: Record<string, unknown> | null = null;

const makeChain = (result: { data: unknown; error: unknown }): Chain => {
  const c: Record<string, unknown> = {};
  ['select', 'single', 'order', 'eq', 'limit', 'is', 'in', 'maybeSingle'].forEach((m) => {
    c[m] = vi.fn(() => c);
  });
  c.then = (resolve: (v: unknown) => void) => resolve(result);
  return c as unknown as Chain;
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((tabela: string) => ({
      select: vi.fn(() => makeChain({ data: null, error: null })),
      insert: vi.fn((valores: Record<string, unknown>) => {
        if (tabela === 'call_sessions') insertPayload = valores;
        return makeChain({
          data: {
            id: 'sess-1',
            caller_name: 'Alice',
            caller_phone: '11999998888',
            agent_name: 'Agente Teste',
            started_at: new Date().toISOString(),
            status: 'active',
          },
          error: null,
        });
      }),
      update: vi.fn((valores: Record<string, unknown>) => {
        if (tabela === 'call_sessions') escritasCallSessions.push(valores);
        return makeChain({ data: null, error: null });
      }),
      delete: vi.fn(() => makeChain({ data: null, error: null })),
    })),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
    removeChannel: vi.fn(),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

vi.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => ({
    user: { id: 'u1' },
    profile: { id: 'u1', full_name: 'Agente Teste', role: 'agent' as const },
    loading: false,
  }),
}));

import { useMultiChannelCall, extrairCallIdBitrix } from '../useMultiChannelCall';

describe('etapa 081 - ponte de chamada com o Bitrix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    escritasCallSessions.length = 0;
    insertPayload = null;
    registerCallMock.mockResolvedValue({ CALL_ID: 987 });
    finishCallMock.mockResolvedValue({ ok: true });
  });

  it('extrai o CALL_ID das duas formas que o Bitrix devolve e recusa o vazio', () => {
    expect(extrairCallIdBitrix({ CALL_ID: 987 })).toBe('987');
    expect(extrairCallIdBitrix({ result: { CALL_ID: 42 } })).toBe('42');
    expect(extrairCallIdBitrix({ queued: true })).toBeNull();
    expect(extrairCallIdBitrix({ error: 'boom' })).toBeNull();
    expect(extrairCallIdBitrix(null)).toBeNull();
    expect(extrairCallIdBitrix('987')).toBeNull();
  });

  it('registra ao atender, guarda o CALL_ID e fecha a chamada com duracao e desfecho', async () => {
    const { result } = renderHook(() => useMultiChannelCall());

    let id = '';
    await act(async () => {
      id = (await result.current.initiateCall('sip', '11999998888', 'Alice'))!.id;
    });

    await act(async () => {
      result.current.updateCallStatus('active', id);
    });

    await vi.waitFor(() => expect(registerCallMock).toHaveBeenCalledTimes(1));
    expect(registerCallMock).toHaveBeenCalledWith(
      expect.objectContaining({ PHONE_NUMBER: '11999998888', TYPE: 1 }),
    );
    // a sessao do banco e a mesma que o E058 acabou de criar
    expect(insertPayload).toMatchObject({ caller_phone: '11999998888', status: 'active' });
    await vi.waitFor(() => expect(result.current.activeCalls.find(c => c.id === id)?.bitrixCallId).toBe('987'));
    await vi.waitFor(() =>
      expect(escritasCallSessions.some(w => w.bitrix_call_id === '987')).toBe(true),
    );

    await act(async () => {
      result.current.endCall(id);
    });
    await vi.waitFor(() => expect(finishCallMock).toHaveBeenCalledTimes(1));
    expect(finishCallMock).toHaveBeenCalledWith('987', expect.any(Number), '200');
  });

  it('sem CALL_ID do Bitrix nao fecha nada e nao quebra a chamada', async () => {
    registerCallMock.mockResolvedValue({ error: 'Bitrix fora do ar' });
    const { result } = renderHook(() => useMultiChannelCall());

    let id = '';
    await act(async () => {
      id = (await result.current.initiateCall('sip', '11888887777', 'Bob'))!.id;
    });
    await act(async () => {
      result.current.updateCallStatus('active', id);
    });
    await vi.waitFor(() => expect(registerCallMock).toHaveBeenCalledTimes(1));

    expect(result.current.activeCalls.find(c => c.id === id)?.bitrixCallId).toBeUndefined();
    expect(escritasCallSessions.some(w => 'bitrix_call_id' in w)).toBe(false);

    await act(async () => {
      result.current.endCall(id);
    });
    expect(finishCallMock).not.toHaveBeenCalled();
    // a chamada continua encerrando normalmente no banco do produto
    await vi.waitFor(() =>
      expect(escritasCallSessions.some(w => w.status === 'completed')).toBe(true),
    );
  });
});