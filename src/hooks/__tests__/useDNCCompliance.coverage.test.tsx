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

    rpcMock.mockResolvedValueOnce({ data: null, error: new Error('boom') });
    await act(async () => {
      res = await result.current.checkDNC('5511999');
    });
    expect(res).toBe(false);
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
      const r = await result.current.checkCallingHours();
      expect(r.can_call).toBe(true);
      expect(r.reason).toContain('Error');
    });
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

    let call = 0;
    rpcMock.mockImplementation(() => {
      call += 1;
      if (call === 2) return Promise.reject(new Error('duplicate key'));
      if (call === 3) return Promise.reject(new Error('other'));
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
});
