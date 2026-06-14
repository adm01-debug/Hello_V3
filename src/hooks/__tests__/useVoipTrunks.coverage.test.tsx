import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useVoipTrunks,
  useTrunkAssignments,
  useSaveTrunk,
  useDeleteTrunk,
  useTestTrunk,
  useSaveAssignment,
  useDeleteAssignment,
} from '../useVoipTrunks';

const invokeMock = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...a: unknown[]) => invokeMock(...a) } },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn(), create: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }) } }));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

describe('useVoipTrunks (coverage)', () => {
  beforeEach(() => { vi.clearAllMocks(); invokeMock.mockResolvedValue({ data: { trunks: [], assignments: [] }, error: null }); });

  it('lists trunks', async () => {
    invokeMock.mockResolvedValue({ data: { trunks: [{ id: 't1' }] }, error: null });
    const { result } = renderHook(() => useVoipTrunks(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 't1' }]);
  });

  it('lists assignments', async () => {
    invokeMock.mockResolvedValue({ data: { assignments: [{ id: 'a1' }] }, error: null });
    const { result } = renderHook(() => useTrunkAssignments(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 'a1' }]);
  });

  it('throws when invoke returns error', async () => {
    invokeMock.mockResolvedValue({ data: null, error: new Error('boom') });
    const { result } = renderHook(() => useVoipTrunks(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('throws when data.error is present', async () => {
    invokeMock.mockResolvedValue({ data: { error: 'data err' }, error: null });
    const { result } = renderHook(() => useVoipTrunks(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('saves a new trunk (create path)', async () => {
    invokeMock.mockResolvedValue({ data: { trunk: { id: 'new' } }, error: null });
    const { result } = renderHook(() => useSaveTrunk(), { wrapper });
    await act(async () => { await result.current.mutateAsync({ name: 'T' }); });
    expect(invokeMock).toHaveBeenCalledWith('voip-trunks-manage', { body: { action: 'create', name: 'T' } });
  });

  it('saves an existing trunk (update path)', async () => {
    invokeMock.mockResolvedValue({ data: { trunk: { id: 'x' } }, error: null });
    const { result } = renderHook(() => useSaveTrunk(), { wrapper });
    await act(async () => { await result.current.mutateAsync({ id: 'x', name: 'T' }); });
    expect(invokeMock).toHaveBeenCalledWith('voip-trunks-manage', { body: { action: 'update', id: 'x', name: 'T' } });
  });

  it('save error path triggers onError', async () => {
    invokeMock.mockResolvedValue({ data: null, error: new Error('fail-save') });
    const { result } = renderHook(() => useSaveTrunk(), { wrapper });
    await act(async () => { await result.current.mutateAsync({ name: 'T' }).catch(() => {}); });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('deletes a trunk', async () => {
    const { result } = renderHook(() => useDeleteTrunk(), { wrapper });
    await act(async () => { await result.current.mutateAsync('id1'); });
    expect(invokeMock).toHaveBeenCalledWith('voip-trunks-manage', { body: { action: 'delete', id: 'id1' } });
  });

  it('delete error path', async () => {
    invokeMock.mockResolvedValue({ data: null, error: new Error('del-fail') });
    const { result } = renderHook(() => useDeleteTrunk(), { wrapper });
    await act(async () => { await result.current.mutateAsync('id1').catch(() => {}); });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('tests trunk reachable success', async () => {
    invokeMock.mockResolvedValue({ data: { reachable: true, latency_ms: 12, server: 'srv' }, error: null });
    const { result } = renderHook(() => useTestTrunk(), { wrapper });
    await act(async () => { await result.current.mutateAsync('id1'); });
    expect(invokeMock).toHaveBeenCalled();
  });

  it('tests trunk unreachable branch', async () => {
    invokeMock.mockResolvedValue({ data: { reachable: false, latency_ms: 0, server: 'srv' }, error: null });
    const { result } = renderHook(() => useTestTrunk(), { wrapper });
    await act(async () => { await result.current.mutateAsync('id1'); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('test trunk error path', async () => {
    invokeMock.mockResolvedValue({ data: null, error: new Error('test-fail') });
    const { result } = renderHook(() => useTestTrunk(), { wrapper });
    await act(async () => { await result.current.mutateAsync('id1').catch(() => {}); });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('saves an assignment', async () => {
    const { result } = renderHook(() => useSaveAssignment(), { wrapper });
    await act(async () => { await result.current.mutateAsync({ agent_id: 'a', trunk_id: 't', is_primary: true }); });
    expect(invokeMock).toHaveBeenCalledWith('voip-trunks-manage', { body: { action: 'create-assignment', agent_id: 'a', trunk_id: 't', is_primary: true } });
  });

  it('save assignment error path', async () => {
    invokeMock.mockResolvedValue({ data: null, error: new Error('assign-fail') });
    const { result } = renderHook(() => useSaveAssignment(), { wrapper });
    await act(async () => { await result.current.mutateAsync({ agent_id: 'a', trunk_id: 't', is_primary: false }).catch(() => {}); });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('deletes an assignment', async () => {
    const { result } = renderHook(() => useDeleteAssignment(), { wrapper });
    await act(async () => { await result.current.mutateAsync('id1'); });
    expect(invokeMock).toHaveBeenCalledWith('voip-trunks-manage', { body: { action: 'delete-assignment', id: 'id1' } });
  });
});
