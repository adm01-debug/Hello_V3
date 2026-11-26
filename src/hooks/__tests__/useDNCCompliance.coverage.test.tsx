import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const makeChain = (result: { data: unknown; error: unknown }) => {
  const c: Record<string, unknown> = {};
  ['select', 'order', 'eq', 'gte', 'lte', 'lt', 'gt', 'is', 'in', 'or', 'match', 'range', 'limit', 'contains', 'maybeSingle', 'single', 'update'].forEach((m) => {
    c[m] = vi.fn(() => c);
  });
  (c as { then: (r: (v: unknown) => void) => void }).then = (resolve) => resolve(result);
  return c;
};

const rpcMock = vi.fn();
const fromMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => (fromMock as (...a: unknown[]) => unknown)(...args),
    rpc: (...args: unknown[]) => (rpcMock as (...a: unknown[]) => unknown)(...args),
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

import { useDNCCompliance } from '../useDNCCompliance';
import { toast } from 'sonner';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

describe('useDNCCompliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rpcMock.mockResolvedValue({ data: true, error: null });
    fromMock.mockImplementation((table: string) => {
      if (table === 'compliance_settings') {
        return {
          select: vi.fn(() => makeChain({ data: [{ id: 'c1', setting_key: 'dnc_enabled', setting_value: 'true', description: null }, { id: 'c2', setting_key: 'calling_hours_enabled', setting_value: 'true', description: null }], error: null })),
          update: vi.fn(() => makeChain({ data: null, error: null })),
        };
      }
      return {
        select: vi.fn(() => makeChain({ data: [], error: null })),
        update: vi.fn(() => makeChain({ data: null, error: null })),
      };
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it('loads queries and getSettingValue parses values', async () => {
    const { result } = renderHook(() => useDNCCompliance(), { wrapper });
    await waitFor(() => expect(result.current.isLoadingSettings).toBe(false));
    expect(result.current.getSettingValue('dnc_enabled', false)).toBe(true);
    expect(result.current.getSettingValue('missing', 'def')).toBe('def');
  });

  it('checkDNC success and error branches', async () => {
    const { result } = renderHook(() => useDNCCompliance(), { wrapper });
    await waitFor(() => expect(result.current.isLoadingSettings).toBe(false));

    let res: boolean | undefined;
    await act(async () => {
      res = await result.current.checkDNC('5511999');
    });
    expect(res).toBe(true);

    // Etapa 035: erro de leitura precisa subir, nao virar "nao esta na DNC".
    rpcMock.mockResolvedValueOnce({ data: null, error: new Error('boom') });
    await act(async () => {
      await expect(result.current.checkDNC('5511999')).rejects.toThrow('boom');
    });
  });

  it('checkCallingHours success and error branches', async () => {
    const { result } = renderHook(() => useDNCCompliance(), { wrapper });
    await waitFor(() => expect(result.current.isLoadingSettings).toBe(false));

    rpcMock.mockResolvedValueOnce({ data: { can_call: true, reason: 'ok' }, error: null });
    await act(async () => {
      const r = await result.current.checkCallingHours('BR');
      expect(r.can_call).toBe(true);
    });

    rpcMock.mockResolvedValueOnce({ data: null, error: new Error('boom') });
    await act(async () => {
      await expect(result.current.checkCallingHours()).rejects.toThrow('boom');
    });
  });

  it('preDialCheck falha fechado quando o RPC nao responde (etapa 035)', async () => {
    const { result } = renderHook(() => useDNCCompliance(), { wrapper });
    await waitFor(() => expect(result.current.isLoadingSettings).toBe(false));

    rpcMock.mockImplementation(() => Promise.resolve({ data: null, error: new Error('permission denied') }));

    let out: { canDial: boolean; reasons: string[] } | undefined;
    await act(async () => {
      out = await result.current.preDialCheck('5511999', 'BR');
    });

    expect(out!.canDial).toBe(false);
    expect(out!.reasons.join(' ')).toContain('Discagem bloqueada por segurança');
    expect(out!.reasons.join(' ')).toContain('permission denied');
  });

  it('preDialCheck combines DNC + hours', async () => {
    const { result } = renderHook(() => useDNCCompliance(), { wrapper });
    await waitFor(() => expect(result.current.isLoadingSettings).toBe(false));

    // dnc returns true (in list), hours returns cannot call
    rpcMock.mockImplementation((fn: string) => {
      if (fn === 'check_dnc') return Promise.resolve({ data: true, error: null });
      if (fn === 'check_calling_hours') return Promise.resolve({ data: { can_call: false, reason: 'fora do horario' }, error: null });
      return Promise.resolve({ data: null, error: null });
    });

    let out: { canDial: boolean; reasons: string[] } | undefined;
    await act(async () => {
      out = await result.current.preDialCheck('5511999', 'BR');
    });
    expect(out!.canDial).toBe(false);
    expect(out!.reasons.length).toBeGreaterThanOrEqual(2);
  });

  it('bulkImportDNC tallies success, duplicates and failures', async () => {
    const { result } = renderHook(() => useDNCCompliance(), { wrapper });
    await waitFor(() => expect(result.current.isLoadingSettings).toBe(false));

    // O cliente postgrest-js devolve { error } no resultado, nunca lanca.
    let call = 0;
    rpcMock.mockImplementation(() => {
      call += 1;
      if (call === 2) return Promise.resolve({ data: null, error: { message: 'duplicate key value violates unique constraint' } });
      if (call === 3) return Promise.resolve({ data: null, error: { message: 'permission denied for function add_to_dnc' } });
      return Promise.resolve({ data: null, error: null });
    });

    let results: { success: number; failed: number; duplicates: number } | undefined;
    await act(async () => {
      results = await result.current.bulkImportDNC(['1', '2', '3']);
    });
    expect(results!.success).toBe(1);
    expect(results!.duplicates).toBe(1);
    expect(results!.failed).toBe(1);
  });

  it('addToDNC mutation success and error', async () => {
    const { result } = renderHook(() => useDNCCompliance(), { wrapper });
    await waitFor(() => expect(result.current.isLoadingSettings).toBe(false));

    rpcMock.mockResolvedValue({ data: { id: 'x' }, error: null });
    await act(async () => {
      result.current.addToDNC({ phone: '5511999', reason: 'manual' });
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalled());

    rpcMock.mockResolvedValue({ data: null, error: new Error('add fail') });
    await act(async () => {
      result.current.addToDNC({ phone: '5511000' });
    });
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it('removeFromDNC mutation success and error', async () => {
    const { result } = renderHook(() => useDNCCompliance(), { wrapper });
    await waitFor(() => expect(result.current.isLoadingSettings).toBe(false));

    fromMock.mockImplementationOnce(() => ({ update: vi.fn(() => makeChain({ data: null, error: null })) }));
    await act(async () => {
      result.current.removeFromDNC('id-1');
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalled());

    fromMock.mockImplementationOnce(() => ({ update: vi.fn(() => makeChain({ data: null, error: new Error('rm fail') })) }));
    await act(async () => {
      result.current.removeFromDNC('id-2');
    });
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it('updateSetting mutation success and error', async () => {
    const { result } = renderHook(() => useDNCCompliance(), { wrapper });
    await waitFor(() => expect(result.current.isLoadingSettings).toBe(false));

    await act(async () => {
      result.current.updateSetting({ key: 'dnc_enabled', value: false });
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalled());

    fromMock.mockImplementationOnce(() => ({ update: vi.fn(() => makeChain({ data: null, error: new Error('upd fail') })) }));
    await act(async () => {
      result.current.updateSetting({ key: 'dnc_enabled', value: true });
    });
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it('updateDNC grava motivo, observacao e validade da entrada', async () => {
    const { result } = renderHook(() => useDNCCompliance(), { wrapper });
    await waitFor(() => expect(result.current.isLoadingSettings).toBe(false));

    const updateFn = vi.fn((_payload: Record<string, unknown>) => makeChain({ data: null, error: null }));
    fromMock.mockImplementationOnce(() => ({ update: updateFn }));
    await act(async () => {
      result.current.updateDNC({
        id: 'dnc-1',
        reason: 'complaint',
        notes: 'pedido do titular',
        expires_at: '2026-12-31T23:59:59.000Z',
      });
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalled());

    expect(fromMock).toHaveBeenCalledWith('dnc_list');
    const payload = updateFn.mock.calls[0][0];
    expect(payload.reason).toBe('complaint');
    expect(payload.notes).toBe('pedido do titular');
    expect(payload.expires_at).toBe('2026-12-31T23:59:59.000Z');
    expect(payload.updated_at).toEqual(expect.any(String));

    fromMock.mockImplementationOnce(() => ({ update: vi.fn(() => makeChain({ data: null, error: new Error('dnc upd fail') })) }));
    await act(async () => {
      result.current.updateDNC({ id: 'dnc-2', reason: 'manual' });
    });
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});
