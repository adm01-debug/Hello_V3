import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const makeChain = (result: { data: unknown; error: unknown }) => {
  const c: Record<string, unknown> = {};
  ['select', 'order', 'eq', 'gte', 'lte', 'lt', 'gt', 'is', 'in', 'or', 'match', 'range', 'limit', 'contains', 'maybeSingle', 'single'].forEach((m) => {
    c[m] = vi.fn(() => c);
  });
  (c as { then: (r: (v: unknown) => void) => void }).then = (resolve) => resolve(result);
  return c;
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => makeChain({ data: { id: 'hold-1' }, error: null })),
      insert: vi.fn().mockResolvedValue({ data: [{ id: '1' }], error: null }),
      update: vi.fn(() => makeChain({ data: null, error: null })),
      delete: vi.fn(() => makeChain({ data: null, error: null })),
    })),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
    removeChannel: vi.fn(),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

vi.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => ({ user: { id: 'u1' }, profile: { id: 'u1', full_name: 'Agente Teste', role: 'agent' as const }, loading: false }),
}));

import { toast } from 'sonner';
import { useMultiChannelCall } from '../useMultiChannelCall';

describe('useMultiChannelCall — barreira de compliance (etapa 034)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('bloqueia a discagem quando o pre-dial check reprova', async () => {
    const preDialCheck = vi.fn().mockResolvedValue({ canDial: false, reasons: ['Numero na lista DNC', 'Fora do horario legal'] });
    const { result } = renderHook(() => useMultiChannelCall(preDialCheck));

    let call: unknown = 'inicial';
    await act(async () => {
      call = await result.current.initiateCall('sip', '+5511999990001', 'Cliente DNC');
    });

    expect(preDialCheck).toHaveBeenCalledWith('+5511999990001');
    expect(call).toBeNull();
    expect(result.current.activeCalls).toHaveLength(0);
    expect(result.current.activeCallId).toBeNull();
    expect(toast.error).toHaveBeenCalledWith(
      'Chamada bloqueada por compliance',
      expect.objectContaining({ description: expect.stringContaining('DNC') }),
    );
  });

  it('libera a discagem quando ha mais de um motivo aprovado', async () => {
    const preDialCheck = vi.fn().mockResolvedValue({ canDial: true, reasons: [] });
    const { result } = renderHook(() => useMultiChannelCall(preDialCheck));

    let id: string | undefined;
    await act(async () => {
      const call = await result.current.initiateCall('sip', '+5511999990002', 'Cliente Ok');
      id = call?.id;
    });

    expect(preDialCheck).toHaveBeenCalledTimes(1);
    expect(id).toBeTruthy();
    expect(result.current.activeCalls).toHaveLength(1);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('chamada recebida ignora a barreira (skipComplianceCheck)', async () => {
    const preDialCheck = vi.fn().mockResolvedValue({ canDial: false, reasons: ['Numero na lista DNC'] });
    const { result } = renderHook(() => useMultiChannelCall(preDialCheck));

    let ok = false;
    await act(async () => {
      const call = await result.current.initiateCall('sip', '+5511999990003', 'Ligando', { skipComplianceCheck: true });
      ok = Boolean(call);
    });

    expect(preDialCheck).not.toHaveBeenCalled();
    expect(ok).toBe(true);
    expect(result.current.activeCalls).toHaveLength(1);
  });

  it('falha do check nao impede a chamada (fail-open ate a etapa 035)', async () => {
    const preDialCheck = vi.fn().mockRejectedValue(new Error('rpc indisponivel'));
    const { result } = renderHook(() => useMultiChannelCall(preDialCheck));

    let ok = false;
    await act(async () => {
      const call = await result.current.initiateCall('sip', '+5511999990004');
      ok = Boolean(call);
    });

    expect(preDialCheck).toHaveBeenCalledTimes(1);
    expect(ok).toBe(true);
    expect(result.current.activeCalls).toHaveLength(1);
  });

  it('sem preDialCheck injetado mantem o comportamento antigo', async () => {
    const { result } = renderHook(() => useMultiChannelCall());

    let ok = false;
    await act(async () => {
      const call = await result.current.initiateCall('webrtc', undefined, 'Agente IA');
      ok = Boolean(call);
    });

    expect(ok).toBe(true);
    expect(result.current.activeCalls).toHaveLength(1);
  });
});
