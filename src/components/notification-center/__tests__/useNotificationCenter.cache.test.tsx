import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import { useNotificationCenter } from '../useNotificationCenter';

const tableResults: Record<string, { data: unknown; error: unknown }> = {};

vi.mock('@/integrations/supabase/client', () => {
  const makeChain = (table: string) => {
    const c: Record<string, unknown> = {};
    ['select', 'order', 'eq', 'limit', 'upsert', 'maybeSingle', 'single', 'update', 'delete'].forEach((m) => {
      c[m] = vi.fn(() => c);
    });
    (c as { then: (r: (v: { data: unknown; error: unknown }) => void) => void }).then = (resolve) =>
      resolve(tableResults[table] ?? { data: [], error: null });
    return c;
  };
  return { supabase: { from: vi.fn((table: string) => makeChain(table)) } };
});

const usuario = (id: string) => ({ id } as User);

const wrapperFor = (client: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

describe('useNotificationCenter — chave de cache por usuario', () => {
  beforeEach(() => {
    tableResults.notifications = { data: [], error: null };
    tableResults.notification_preferences = { data: null, error: null };
  });

  it('nao mostra as notificacoes que ficaram no cache do usuario anterior', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    // Sobra de uma sessao anterior no mesmo navegador (chave sem o id do usuario).
    client.setQueryData(['notifications-center', 'all'], [
      { id: 'n-antiga', user_id: 'outro-usuario', title: 'Do outro usuario' },
    ]);

    const { result } = renderHook(() => useNotificationCenter(usuario('user-a'), 'all'), {
      wrapper: wrapperFor(client),
    });

    expect(result.current.notifications).toEqual([]);
  });

  it('nao mostra as preferencias que ficaram no cache do usuario anterior', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(['notification-preferences'], { user_id: 'outro-usuario', email_enabled: true });

    const { result } = renderHook(() => useNotificationCenter(usuario('user-a'), 'all'), {
      wrapper: wrapperFor(client),
    });

    expect(result.current.preferences).toBeNull();
  });
});