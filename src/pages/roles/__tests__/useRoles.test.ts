import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRoles } from '../useRoles';

type QueryResult = { data: unknown; error: unknown };

const state = {
  rolesResult: { data: [] as unknown, error: null as unknown } as QueryResult,
  profilesResult: { data: [] as unknown, error: null as unknown } as QueryResult,
  profileByEmailResult: { data: null as unknown, error: null as unknown } as QueryResult,
  insertResult: { data: null as unknown, error: null as unknown } as QueryResult,
  deleteResult: { data: null as unknown, error: null as unknown } as QueryResult,
  updateResult: { data: null as unknown, error: null as unknown } as QueryResult,
};

vi.mock('@/integrations/supabase/client', () => {
  function makeUserRolesBuilder() {
    const b: Record<string, unknown> = {};
    b.select = vi.fn().mockReturnValue(b);
    b.order = vi.fn(() =>
      Promise.resolve(state.rolesResult),
    );
    b.insert = vi.fn(() => Promise.resolve(state.insertResult));
    b.delete = vi.fn().mockReturnValue(b);
    b.update = vi.fn().mockReturnValue(b);
    b.eq = vi.fn(() => Promise.resolve(state.deleteResult));
    return b;
  }

  function makeUserProfilesBuilder() {
    const b: Record<string, unknown> = {};
    b.select = vi.fn().mockReturnValue(b);
    b.in = vi.fn(() => Promise.resolve(state.profilesResult));
    b.eq = vi.fn().mockReturnValue(b);
    b.maybeSingle = vi.fn(() => Promise.resolve(state.profileByEmailResult));
    return b;
  }

  return {
    supabase: {
      from: vi.fn((table: string) =>
        table === 'user_profiles' ? makeUserProfilesBuilder() : makeUserRolesBuilder(),
      ),
    },
  };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

async function importToast() {
  const mod = await import('sonner');
  return mod.toast as unknown as { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
}

beforeEach(() => {
  vi.clearAllMocks();
  state.rolesResult = { data: [], error: null };
  state.profilesResult = { data: [], error: null };
  state.profileByEmailResult = { data: null, error: null };
  state.insertResult = { data: null, error: null };
  state.deleteResult = { data: null, error: null };
  state.updateResult = { data: null, error: null };
});

describe('useRoles', () => {
  it('carrega roles e enriquece com email/nome', async () => {
    state.rolesResult = {
      data: [
        { id: 'r1', user_id: 'u1', role: 'admin', is_active: true, granted_at: null, expires_at: null },
      ],
      error: null,
    };
    state.profilesResult = {
      data: [{ id: 'u1', email: 'foo@bar.com', full_name: 'Foo Bar' }],
      error: null,
    };

    const { result } = renderHook(() => useRoles('current-user'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.userRoles).toHaveLength(1);
    expect(result.current.userRoles[0].user_email).toBe('foo@bar.com');
    expect(result.current.userRoles[0].user_name).toBe('Foo Bar');
  });

  it('mostra erro ao carregar falhar', async () => {
    state.rolesResult = { data: null, error: new Error('boom') };
    const toast = await importToast();

    const { result } = renderHook(() => useRoles('u'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(toast.error).toHaveBeenCalledWith('Erro ao carregar roles');
    expect(result.current.userRoles).toEqual([]);
  });

  it('addRole retorna false quando usuário não existe', async () => {
    state.profileByEmailResult = { data: null, error: null };
    const toast = await importToast();

    const { result } = renderHook(() => useRoles('cur'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let ok = true;
    await act(async () => { ok = await result.current.addRole('none@x.com', 'admin'); });

    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(
      'Usuário não encontrado',
      expect.objectContaining({ description: expect.any(String) }),
    );
  });

  it('addRole detecta duplicidade (23505)', async () => {
    state.profileByEmailResult = { data: { id: 'u1' }, error: null };
    state.insertResult = { data: null, error: { code: '23505', message: 'dup' } };
    const toast = await importToast();

    const { result } = renderHook(() => useRoles('cur'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let ok = true;
    await act(async () => { ok = await result.current.addRole('a@b.com', 'admin'); });

    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Role já existe', expect.any(Object));
  });

  it('addRole cria com sucesso e recarrega', async () => {
    state.profileByEmailResult = { data: { id: 'u1' }, error: null };
    state.insertResult = { data: null, error: null };
    const toast = await importToast();

    const { result } = renderHook(() => useRoles('cur'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let ok = false;
    await act(async () => { ok = await result.current.addRole('a@b.com', 'admin'); });

    expect(ok).toBe(true);
    expect(toast.success).toHaveBeenCalledWith('Role adicionada com sucesso!');
  });

  it('removeRole exibe sucesso', async () => {
    state.deleteResult = { data: null, error: null };
    const toast = await importToast();

    const { result } = renderHook(() => useRoles('cur'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.removeRole('r1'); });
    expect(toast.success).toHaveBeenCalledWith('Role removida');
  });

  it('toggleRoleStatus alterna e exibe toast correspondente', async () => {
    state.deleteResult = { data: null, error: null }; // eq() usa este slot
    const toast = await importToast();

    const { result } = renderHook(() => useRoles('cur'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.toggleRoleStatus('r1', true); });
    expect(toast.success).toHaveBeenCalledWith('Role desativada');

    await act(async () => { await result.current.toggleRoleStatus('r1', false); });
    expect(toast.success).toHaveBeenCalledWith('Role ativada');
  });
});
