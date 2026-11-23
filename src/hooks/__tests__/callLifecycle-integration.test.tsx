import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// --- Supabase mock com cadeia insert().select().single() ---
const insertMock = vi.fn();
const updateEqMock = vi.fn().mockResolvedValue({ data: null, error: null });
const updateMock = vi.fn(() => ({ eq: updateEqMock }));

const makeSessionData = (phone: string, name: string) => ({
  id: `sess-${phone.slice(-4)}`,
  caller_name: name,
  caller_phone: phone,
  agent_name: 'Agente Teste',
  started_at: new Date().toISOString(),
});

// insert retorna chain com select().single()
insertMock.mockImplementation((data: unknown) => {
  const row = Array.isArray(data) ? (data as Array<Record<string, unknown>>)[0] : (data as Record<string, unknown>);
  const phone = (row?.caller_phone ?? '') as string;
  const name = (row?.caller_name ?? 'Cliente') as string;
  return {
    select: () => ({
      single: () => Promise.resolve({ data: makeSessionData(phone, name), error: null }),
    }),
  };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: insertMock,
      update: updateMock,
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
      delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) })),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
    removeChannel: vi.fn(),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
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

import { useMultiChannelCall } from '../useMultiChannelCall';

describe('Ciclo de vida da chamada — integracao (E064)', () => {
  let nowCounter = 1_700_000_000_000;

  beforeEach(() => {
    vi.clearAllMocks();
    nowCounter = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => (nowCounter += 1000));
    // Restaurar implementacao do insertMock apos clearAllMocks
    insertMock.mockImplementation((data: unknown) => {
      const row = Array.isArray(data) ? (data as Array<Record<string, unknown>>)[0] : (data as Record<string, unknown>);
      const phone = (row?.caller_phone ?? '') as string;
      const name = (row?.caller_name ?? 'Cliente') as string;
      return {
        select: () => ({
          single: () => Promise.resolve({ data: makeSessionData(phone, name), error: null }),
        }),
      };
    });
    updateMock.mockImplementation(() => ({ eq: updateEqMock }));
    updateEqMock.mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('INSERT em call_sessions ao ficar ativa com campos corretos', async () => {
    const { result } = renderHook(() => useMultiChannelCall());

    let callId = '';
    act(() => {
      const call = result.current.initiateCall('webrtc', '+5511999990001', 'Cliente Teste');
      callId = call!.id;
    });
    expect(result.current.activeCalls).toHaveLength(1);
    expect(result.current.activeCalls[0].status).toBe('connecting');

    // Atualizar para ativo — dispara startSession -> INSERT em call_sessions
    act(() => { result.current.updateCallStatus('active', callId); });

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalled();
    }, { timeout: 3000 });

    // Verificar campos do INSERT
    const insertArg = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(insertArg.caller_phone).toBe('+5511999990001');
    expect(insertArg.caller_name).toBe('Cliente Teste');
    expect(insertArg.agent_name).toBe('Agente Teste');
    expect(insertArg.status).toBe('active');

    // Aguardar dbSessionId ser populado no estado
    await waitFor(() => {
      const call = result.current.activeCalls.find(c => c.id === callId);
      expect(call?.dbSessionId).toBeDefined();
    }, { timeout: 3000 });
  }, 10000);

  it('UPDATE em call_sessions ao encerrar chamada', async () => {
    const { result } = renderHook(() => useMultiChannelCall());

    let callId = '';
    act(() => {
      const call = result.current.initiateCall('webrtc', '+5511999990002', 'Cliente B');
      callId = call!.id;
    });

    act(() => { result.current.updateCallStatus('active', callId); });
    await waitFor(() => expect(insertMock).toHaveBeenCalled(), { timeout: 3000 });
    await waitFor(() => {
      const call = result.current.activeCalls.find(c => c.id === callId);
      expect(call?.dbSessionId).toBeDefined();
    }, { timeout: 3000 });

    insertMock.mockClear();
    updateEqMock.mockClear();

    act(() => { result.current.endCall(callId); });

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalled();
    }, { timeout: 3000 });

    expect(result.current.activeCalls).toHaveLength(0);
  }, 15000);

  it('sem INSERT se chamada for encerrada antes de ficar ativa', async () => {
    const { result } = renderHook(() => useMultiChannelCall());

    let callId = '';
    act(() => {
      const call = result.current.initiateCall('webrtc', '+5511000000003', 'Desligou cedo');
      callId = call!.id;
    });

    // Encerra sem chamar updateCallStatus('active')
    act(() => { result.current.endCall(callId); });

    // Aguardar tick async
    await act(async () => { await new Promise<void>(r => setTimeout(r, 300)); });

    expect(insertMock).not.toHaveBeenCalled();
    expect(result.current.activeCalls).toHaveLength(0);
  }, 10000);
});