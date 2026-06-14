import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProfile } from '../useProfile';

const state = {
  selectError: null as unknown,
  updateError: null as unknown,
};

const profileRow = { id: 'u1', email: 'a@b.com', full_name: 'Ana', role: 'admin', agent_id: null };

vi.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => ({ user: { id: 'u1' }, profile: { id: 'u1', role: 'admin' } }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => {
      const builder: Record<string, unknown> = {};
      builder.select = vi.fn(() => builder);
      builder.update = vi.fn(() => builder);
      builder.eq = vi.fn(() => builder);
      builder.single = vi.fn(() => Promise.resolve({ data: profileRow, error: state.selectError }));
      (builder as { then: (r: (v: unknown) => void) => void }).then = (resolve) =>
        resolve({ data: null, error: state.updateError });
      return builder;
    }),
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

beforeEach(() => {
  state.selectError = null;
  state.updateError = null;
  vi.clearAllMocks();
});

describe('useProfile', () => {
  it('loads profile on mount', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper });
    await waitFor(() => expect(result.current.profile?.id).toBe('u1'));
    expect(result.current.profile?.full_name).toBe('Ana');
  });

  it('updates profile successfully', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper });
    await waitFor(() => expect(result.current.profile?.id).toBe('u1'));
    await act(async () => {
      await result.current.updateProfile.mutateAsync({ full_name: 'Bob' });
    });
    const { toast } = await import('sonner');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Perfil atualizado com sucesso'));
  });

  it('strips id/role from updates and rolls back on error', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper });
    await waitFor(() => expect(result.current.profile?.id).toBe('u1'));
    state.updateError = new Error('update fail');
    await act(async () => {
      await result.current.updateProfile.mutateAsync({ id: 'u1', role: 'viewer', full_name: 'X' }).catch(() => undefined);
    });
    const { toast } = await import('sonner');
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Erro ao atualizar perfil', { description: 'update fail' }));
  });

  it('query throws when select errors', async () => {
    state.selectError = new Error('select fail');
    const { result } = renderHook(() => useProfile(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.profile).toBeUndefined();
  });
});
