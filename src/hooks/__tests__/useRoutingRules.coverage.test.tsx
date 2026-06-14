import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRoutingRules, useUpsertRoutingRule, useDeleteRoutingRule } from '../useRoutingRules';

const fromMock = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...a: unknown[]) => fromMock(...a) },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

describe('useRoutingRules (coverage)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads rules', async () => {
    fromMock.mockReturnValue({ select: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [{ id: 'r1' }], error: null }) });
    const { result } = renderHook(() => useRoutingRules(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  it('rules fetch error', async () => {
    fromMock.mockReturnValue({ select: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: null, error: new Error('fetch') }) });
    const { result } = renderHook(() => useRoutingRules(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('upsert success', async () => {
    fromMock.mockReturnValue({ upsert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { id: 'r1' }, error: null }) })) })) });
    const { result } = renderHook(() => useUpsertRoutingRule(), { wrapper });
    await act(async () => { await result.current.mutateAsync({ name: 'rule' }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('upsert error', async () => {
    fromMock.mockReturnValue({ upsert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: new Error('up') }) })) })) });
    const { result } = renderHook(() => useUpsertRoutingRule(), { wrapper });
    await act(async () => { await result.current.mutateAsync({ name: 'rule' }).catch(() => {}); });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('delete success', async () => {
    fromMock.mockReturnValue({ delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })) });
    const { result } = renderHook(() => useDeleteRoutingRule(), { wrapper });
    await act(async () => { await result.current.mutateAsync('r1'); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('delete error', async () => {
    fromMock.mockReturnValue({ delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: new Error('del') }) })) });
    const { result } = renderHook(() => useDeleteRoutingRule(), { wrapper });
    await act(async () => { await result.current.mutateAsync('r1').catch(() => {}); });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
