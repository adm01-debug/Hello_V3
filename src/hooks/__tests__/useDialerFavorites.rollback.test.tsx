import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

type Resolve = (value: { data: null; error: { message: string } | null }) => void;

// Leituras nunca concluem: se o rollback dependesse de refetch, a tela ficaria
// com o estado otimista errado. Escritas ficam pendentes até o teste decidir.
const pendingWrites: Resolve[] = [];
const updateSpy = vi.fn();

vi.mock('@/integrations/supabase/client', () => {
  const makeChain = () => {
    const chain: Record<string, unknown> = { isWrite: false };
    ['select', 'order', 'eq'].forEach((method) => {
      chain[method] = vi.fn(() => chain);
    });
    chain.update = vi.fn((payload: unknown) => {
      updateSpy(payload);
      chain.isWrite = true;
      return chain;
    });
    (chain as { then: unknown }).then = (resolve: Resolve) => {
      if (chain.isWrite) {
        pendingWrites.push(resolve);
        return undefined;
      }
      return new Promise(() => {});
    };
    return chain;
  };
  return {
    supabase: {
      from: vi.fn(() => makeChain()),
      auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'u1' } } })) },
    },
  };
});

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/hooks/useSyncHistory', () => ({ pushSyncEvent: vi.fn() }));
vi.mock('@/lib/device-identity', () => ({ getCurrentDeviceLabel: () => 'dispositivo-teste' }));

import { useDialerFavorites, type DialerFavorite } from '@/hooks/useDialerFavorites';

const QUERY_KEY = ['dialer-favorites'] as const;

const baseFavorites = (): DialerFavorite[] => [
  { id: 'f1', phone: '+5511999990001', label: 'Ana', position: 0, tag: null },
  { id: 'f2', phone: '+5511999990002', label: 'Bruno', position: 1, tag: null },
];

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
  queryClient.setQueryData<DialerFavorite[]>(QUERY_KEY, baseFavorites());
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  const view = renderHook(() => useDialerFavorites(), { wrapper });
  return { queryClient, ...view };
}

async function failPendingWrites() {
  const batch = pendingWrites.splice(0);
  await act(async () => {
    batch.forEach((resolve) => resolve({ data: null, error: { message: 'falha simulada' } }));
  });
}

describe('useDialerFavorites — rollback das mutações otimistas', () => {
  beforeEach(() => {
    pendingWrites.length = 0;
    updateSpy.mockClear();
  });

  it('restaura a ordem anterior quando a reordenação falha', async () => {
    const { queryClient, result } = setup();
    const cache = () => queryClient.getQueryData<DialerFavorite[]>(QUERY_KEY)?.map(f => f.id);

    act(() => result.current.moveFavorite(0, 1));

    await waitFor(() => expect(cache()).toEqual(['f2', 'f1']));
    await waitFor(() => expect(pendingWrites.length).toBeGreaterThan(0));

    await failPendingWrites();

    await waitFor(() => expect(cache()).toEqual(['f1', 'f2']));
  });

  it('restaura a etiqueta anterior quando a gravação da etiqueta falha', async () => {
    const { queryClient, result } = setup();
    const tagOf = (id: string) =>
      queryClient.getQueryData<DialerFavorite[]>(QUERY_KEY)?.find(f => f.id === id)?.tag;

    act(() => result.current.setFavoriteTag('f2', 'VIP'));

    await waitFor(() => expect(tagOf('f2')).toBe('VIP'));
    await waitFor(() => expect(pendingWrites.length).toBeGreaterThan(0));

    await failPendingWrites();

    await waitFor(() => expect(tagOf('f2')).toBeNull());
    expect(tagOf('f1')).toBeNull();
  });
});
