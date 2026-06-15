import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useSlaPolicies,
  useSlaCompliance,
  useUpsertSlaPolicy,
  useEnforceSla,
} from '../useSLA';

const policyRows = [
  {
    id: 'p1',
    name: 'High',
    description: null,
    channel: 'whatsapp',
    priority: 'high',
    first_response_minutes: 15,
    resolution_minutes: 120,
    business_hours_only: false,
    is_active: true,
    applies_to_tags: null,
    created_at: '',
    updated_at: '',
  },
];

const conversationRows = [
  { id: 'c1', sla_breached: true, status: 'open', channel: 'whatsapp', created_at: '2026-06-10' },
  { id: 'c2', sla_breached: false, status: 'closed', channel: 'whatsapp', created_at: '2026-06-11' },
  { id: 'c3', sla_breached: false, status: 'closed', channel: null, created_at: '2026-06-12' },
];

const state = {
  policiesError: null as unknown,
  conversationsError: null as unknown,
  upsertError: null as unknown,
  invokeError: null as unknown,
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      const builder: Record<string, unknown> = {};
      builder.select = vi.fn().mockReturnValue(builder);
      builder.eq = vi.fn().mockReturnValue(builder);
      builder.gte = vi.fn().mockReturnValue(builder);
      builder.limit = vi.fn().mockResolvedValue({
        data: conversationRows,
        error: state.conversationsError,
      });
      builder.order = vi.fn().mockResolvedValue({
        data: policyRows,
        error: state.policiesError,
      });
      builder.upsert = vi.fn().mockReturnValue(builder);
      builder.single = vi.fn().mockResolvedValue({
        data: policyRows[0],
        error: state.upsertError,
      });
      return builder;
    }),
    functions: {
      invoke: vi.fn(() =>
        Promise.resolve({
          data: { evaluated: 5, breached: 2 },
          error: state.invokeError,
        }),
      ),
    },
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/logger', () => {
  const mk = () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() });
  return { logger: { create: vi.fn(mk), ...mk() } };
});
vi.mock('@/lib/tracing', () => ({
  traceHeaders: () => ({ 'x-request-id': 't1' }),
  withTrace: (_op: string, fn: () => unknown) => fn(),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  state.policiesError = null;
  state.conversationsError = null;
  state.upsertError = null;
  state.invokeError = null;
});

describe('useSLA', () => {
  it('useSlaPolicies loads policies', async () => {
    const { result } = renderHook(() => useSlaPolicies(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBe(1);
  });

  it('useSlaPolicies surfaces error', async () => {
    state.policiesError = new Error('boom');
    const { result } = renderHook(() => useSlaPolicies(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('useSlaCompliance computes compliance', async () => {
    const { result } = renderHook(() => useSlaCompliance(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.total).toBe(3);
    expect(result.current.data?.breached).toBe(1);
    expect(result.current.data?.byChannel.whatsapp.total).toBe(2);
    expect(result.current.data?.byChannel.unknown.total).toBe(1);
  });

  it('useSlaCompliance error path', async () => {
    state.conversationsError = new Error('bad');
    const { result } = renderHook(() => useSlaCompliance(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('useUpsertSlaPolicy success', async () => {
    const { result } = renderHook(() => useUpsertSlaPolicy(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ name: 'New' });
    });
    const { toast } = await import('sonner');
    expect(toast.success).toHaveBeenCalled();
  });

  it('useUpsertSlaPolicy error', async () => {
    state.upsertError = new Error('fail');
    const { result } = renderHook(() => useUpsertSlaPolicy(), { wrapper });
    await act(async () => {
      await expect(result.current.mutateAsync({ name: 'X' })).rejects.toBeTruthy();
    });
    const { toast } = await import('sonner');
    expect(toast.error).toHaveBeenCalled();
  });

  it('useEnforceSla success', async () => {
    const { result } = renderHook(() => useEnforceSla(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync();
    });
    const { toast } = await import('sonner');
    expect(toast.success).toHaveBeenCalled();
  });

  it('useEnforceSla error', async () => {
    state.invokeError = new Error('invoke fail');
    const { result } = renderHook(() => useEnforceSla(), { wrapper });
    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toBeTruthy();
    });
    const { toast } = await import('sonner');
    expect(toast.error).toHaveBeenCalled();
  });
});
