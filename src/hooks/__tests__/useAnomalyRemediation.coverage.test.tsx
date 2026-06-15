import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAnomalyRemediation } from '../useAnomalyRemediation';

const invoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...a: unknown[]) => invoke(...a) } },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

import { toast } from 'sonner';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

const plan = { action_type: 'a', category: 'codec' as const, severity: 'warning' as const, description: 'desc', destructive: false };
const baseInput = { anomalyId: 'an1', metric: 'mos' as const, kind: 'spike' as const };

describe('useAnomalyRemediation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('applied success', async () => {
    invoke.mockResolvedValue({ data: { applied: true, plan, request_id: 'r' }, error: null });
    const { result } = renderHook(() => useAnomalyRemediation(), { wrapper });
    await act(async () => { result.current.mutate(baseInput); });
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it('idempotent_skip → info', async () => {
    invoke.mockResolvedValue({ data: { applied: false, reason: 'idempotent_skip', plan, request_id: 'r' }, error: null });
    const { result } = renderHook(() => useAnomalyRemediation(), { wrapper });
    await act(async () => { result.current.mutate(baseInput); });
    await waitFor(() => expect(toast.info).toHaveBeenCalled());
  });

  it('dryRun → info', async () => {
    invoke.mockResolvedValue({ data: { applied: false, dryRun: true, plan, request_id: 'r' }, error: null });
    const { result } = renderHook(() => useAnomalyRemediation(), { wrapper });
    await act(async () => { result.current.mutate({ ...baseInput, dryRun: true }); });
    await waitFor(() => expect(toast.info).toHaveBeenCalled());
  });

  it('no action → warning', async () => {
    invoke.mockResolvedValue({ data: { applied: false, plan, request_id: 'r' }, error: null });
    const { result } = renderHook(() => useAnomalyRemediation(), { wrapper });
    await act(async () => { result.current.mutate(baseInput); });
    await waitFor(() => expect(toast.warning).toHaveBeenCalled());
  });

  it('silent skips toast', async () => {
    invoke.mockResolvedValue({ data: { applied: true, plan, request_id: 'r' }, error: null });
    const { result } = renderHook(() => useAnomalyRemediation(), { wrapper });
    await act(async () => { result.current.mutate({ ...baseInput, silent: true }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('error from invoke', async () => {
    invoke.mockResolvedValue({ data: null, error: new Error('bad') });
    const { result } = renderHook(() => useAnomalyRemediation(), { wrapper });
    await act(async () => { result.current.mutate(baseInput); });
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it('empty data throws', async () => {
    invoke.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => useAnomalyRemediation(), { wrapper });
    await act(async () => { result.current.mutate(baseInput); });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
