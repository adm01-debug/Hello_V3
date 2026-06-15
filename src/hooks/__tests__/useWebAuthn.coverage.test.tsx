import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useWebAuthn } from '../useWebAuthn';

interface AuthState {
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null;
}

const authState: AuthState = { user: { id: 'u1', email: 'a@b.com', user_metadata: {} } };

vi.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => authState,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

// Mutable mock control for webauthn-utils (hoisted so the factory can use it)
const utilsMock = vi.hoisted(() => ({
  isWebAuthnSupported: vi.fn(() => true),
  isPlatformAuthenticatorAvailable: vi.fn(async () => true),
  generateChallenge: vi.fn(() => 'challenge-123'),
  startRegistration: vi.fn(async () => ({
    credentialId: 'cred-1',
    publicKey: 'pubkey',
    clientDataJSON: 'cdj',
    attestationObject: 'att',
    transports: ['internal'],
  })),
  startAuthentication: vi.fn(async () => ({
    credentialId: 'cred-1',
    clientDataJSON: 'cdj',
    authenticatorData: 'ad',
    signature: 'sig',
  })),
}));
vi.mock('@/lib/webauthn/webauthn-utils', () => utilsMock);

// Supabase mock: configurable per-table responses
interface QueryResult {
  data: unknown;
  error: unknown;
}

const tableResponses = vi.hoisted(() => ({}) as Record<string, QueryResult>);
function setTable(name: string, res: QueryResult) {
  tableResponses[name] = res;
}

const invokeMock = vi.hoisted(() => vi.fn(async () => ({ data: { success: true }, error: null })));
const getUserMock = vi.hoisted(() => vi.fn(async () => ({ data: { user: { id: 'u1' } }, error: null })));

vi.mock('@/integrations/supabase/client', () => {
  const makeBuilder = (table: string) => {
    const result = () => tableResponses[table] ?? { data: [], error: null };
    const builder: Record<string, unknown> = {};
    const chain = () => builder;
    builder.select = vi.fn(chain);
    builder.insert = vi.fn(async () => result());
    builder.update = vi.fn(chain);
    builder.delete = vi.fn(chain);
    builder.eq = vi.fn(chain);
    builder.order = vi.fn(async () => result());
    // .single()/.maybeSingle() unwrap a single row: if data is an array, return its first element.
    const singleResult = () => {
      const r = result();
      if (Array.isArray(r.data)) {
        return { data: r.data[0] ?? null, error: r.error };
      }
      return r;
    };
    builder.single = vi.fn(async () => singleResult());
    builder.maybeSingle = vi.fn(async () => singleResult());
    // Make the builder awaitable so terminal .eq()/.update()/.delete() chains resolve.
    builder.then = (resolve: (v: QueryResult) => unknown) => resolve(result());
    return builder;
  };
  return {
    supabase: {
      from: vi.fn((table: string) => makeBuilder(table)),
      auth: { getUser: (...a: unknown[]) => getUserMock(...(a as [])) },
      functions: { invoke: (...a: unknown[]) => invokeMock(...(a as [])) },
    },
  };
});

import { toast } from 'sonner';

const flush = () => new Promise(r => setTimeout(r, 0));

describe('useWebAuthn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.user = { id: 'u1', email: 'a@b.com', user_metadata: {} };
    for (const k of Object.keys(tableResponses)) delete tableResponses[k];
    utilsMock.isWebAuthnSupported.mockReturnValue(true);
    utilsMock.isPlatformAuthenticatorAvailable.mockResolvedValue(true);
    invokeMock.mockResolvedValue({ data: { success: true }, error: null });
    getUserMock.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
  });

  it('loads passkeys and reports support on mount', async () => {
    setTable('user_passkeys', {
      data: [{ id: 'p1', credential_id: 'cred-1', friendly_name: 'X', device_type: 'macOS', created_at: '', last_used_at: null }],
      error: null,
    });
    const { result } = renderHook(() => useWebAuthn());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isSupported).toBe(true);
    expect(result.current.isPlatformAvailable).toBe(true);
    expect(result.current.passkeys.length).toBe(1);
    expect(result.current.hasPasskeys).toBe(true);
  });

  it('handles loadPasskeys error path', async () => {
    setTable('user_passkeys', { data: null, error: new Error('boom') });
    const { result } = renderHook(() => useWebAuthn());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.passkeys.length).toBe(0);
  });

  it('does not load when no user', async () => {
    authState.user = null;
    const { result } = renderHook(() => useWebAuthn());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasPasskeys).toBe(false);
  });

  it('registers a passkey successfully', async () => {
    const { result } = renderHook(() => useWebAuthn());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let ok = false;
    await act(async () => { ok = await result.current.registerPasskey('My Key'); });
    expect(ok).toBe(true);
    expect(toast.success).toHaveBeenCalled();
  });

  it('blocks registration without user', async () => {
    authState.user = null;
    const { result } = renderHook(() => useWebAuthn());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let ok = true;
    await act(async () => { ok = await result.current.registerPasskey(); });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Você precisa estar logado para registrar uma passkey');
  });

  it('blocks registration when unsupported', async () => {
    utilsMock.isWebAuthnSupported.mockReturnValue(false);
    const { result } = renderHook(() => useWebAuthn());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let ok = true;
    await act(async () => { ok = await result.current.registerPasskey(); });
    expect(ok).toBe(false);
  });

  it('handles registration NotAllowedError', async () => {
    const err = new Error('cancel'); err.name = 'NotAllowedError';
    utilsMock.startRegistration.mockRejectedValueOnce(err);
    const { result } = renderHook(() => useWebAuthn());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let ok = true;
    await act(async () => { ok = await result.current.registerPasskey(); });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Registro cancelado pelo usuário');
  });

  it('handles registration InvalidStateError', async () => {
    const err = new Error('dup'); err.name = 'InvalidStateError';
    utilsMock.startRegistration.mockRejectedValueOnce(err);
    const { result } = renderHook(() => useWebAuthn());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.registerPasskey(); });
    expect(toast.error).toHaveBeenCalledWith('Esta passkey já está registrada');
  });

  it('authenticates with passkey successfully (with email)', async () => {
    setTable('user_profiles', { data: { id: 'u1', email: 'a@b.com' }, error: null });
    setTable('user_passkeys', { data: [{ user_id: 'u1', counter: 0, credential_id: 'cred-1' }], error: null });
    const { result } = renderHook(() => useWebAuthn());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let res: { success: boolean; userId?: string } = { success: false };
    await act(async () => { res = await result.current.authenticateWithPasskey('a@b.com'); });
    await flush();
    expect(res.success).toBe(true);
    expect(res.userId).toBe('u1');
  });

  it('authenticates without email param', async () => {
    setTable('user_profiles', { data: { id: 'u1', email: 'a@b.com' }, error: null });
    setTable('user_passkeys', { data: [{ user_id: 'u1', counter: 5, credential_id: 'cred-1' }], error: null });
    const { result } = renderHook(() => useWebAuthn());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let res: { success: boolean } = { success: false };
    await act(async () => { res = await result.current.authenticateWithPasskey(); });
    expect(res.success).toBe(true);
  });

  it('auth fails when unsupported', async () => {
    utilsMock.isWebAuthnSupported.mockReturnValue(false);
    const { result } = renderHook(() => useWebAuthn());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let res: { success: boolean } = { success: true };
    await act(async () => { res = await result.current.authenticateWithPasskey(); });
    expect(res.success).toBe(false);
  });

  it('auth fails when no current user', async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null } as never);
    const { result } = renderHook(() => useWebAuthn());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let res: { success: boolean } = { success: true };
    await act(async () => { res = await result.current.authenticateWithPasskey(); });
    expect(res.success).toBe(false);
  });

  it('auth fails when passkey not found', async () => {
    setTable('user_passkeys', { data: null, error: new Error('nope') });
    const { result } = renderHook(() => useWebAuthn());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let res: { success: boolean } = { success: true };
    await act(async () => { res = await result.current.authenticateWithPasskey(); });
    expect(res.success).toBe(false);
  });

  it('auth fails when edge function errors', async () => {
    setTable('user_profiles', { data: { id: 'u1', email: 'a@b.com' }, error: null });
    setTable('user_passkeys', { data: [{ user_id: 'u1', counter: 0, credential_id: 'cred-1' }], error: null });
    invokeMock.mockResolvedValue({ data: { success: false }, error: { message: 'bad' } } as never);
    const { result } = renderHook(() => useWebAuthn());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let res: { success: boolean } = { success: true };
    await act(async () => { res = await result.current.authenticateWithPasskey('a@b.com'); });
    expect(res.success).toBe(false);
  });

  it('handles auth NotAllowedError', async () => {
    const err = new Error('cancel'); err.name = 'NotAllowedError';
    utilsMock.startAuthentication.mockRejectedValueOnce(err);
    const { result } = renderHook(() => useWebAuthn());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.authenticateWithPasskey(); });
    expect(toast.error).toHaveBeenCalledWith('Autenticação cancelada pelo usuário');
  });

  it('removes a passkey successfully', async () => {
    const { result } = renderHook(() => useWebAuthn());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let ok = false;
    await act(async () => { ok = await result.current.removePasskey('p1'); });
    expect(ok).toBe(true);
    expect(toast.success).toHaveBeenCalledWith('Passkey removida com sucesso');
  });

  it('renames a passkey successfully', async () => {
    const { result } = renderHook(() => useWebAuthn());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let ok = false;
    await act(async () => { ok = await result.current.renamePasskey('p1', 'New'); });
    expect(ok).toBe(true);
    expect(toast.success).toHaveBeenCalledWith('Passkey renomeada');
  });

  it('registers with default friendly name when none given', async () => {
    const { result } = renderHook(() => useWebAuthn());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let ok = false;
    await act(async () => { ok = await result.current.registerPasskey(); });
    expect(ok).toBe(true);
  });

  it('handles registration challenge insert error', async () => {
    setTable('webauthn_challenges', { data: null, error: new Error('challenge fail') });
    const { result } = renderHook(() => useWebAuthn());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let ok = true;
    await act(async () => { ok = await result.current.registerPasskey('K'); });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Erro ao registrar passkey', expect.anything());
  });

  it('handles remove passkey error', async () => {
    setTable('user_passkeys', { data: null, error: new Error('del fail') });
    const { result } = renderHook(() => useWebAuthn());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let ok = true;
    await act(async () => { ok = await result.current.removePasskey('p1'); });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Erro ao remover passkey', expect.anything());
  });

  it('handles rename passkey error', async () => {
    setTable('user_passkeys', { data: null, error: new Error('upd fail') });
    const { result } = renderHook(() => useWebAuthn());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let ok = true;
    await act(async () => { ok = await result.current.renamePasskey('p1', 'New'); });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Erro ao renomear passkey', expect.anything());
  });

  it('exposes refreshPasskeys', async () => {
    const { result } = renderHook(() => useWebAuthn());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.refreshPasskeys(); });
    expect(typeof result.current.refreshPasskeys).toBe('function');
  });
});
