import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { webcrypto } from 'node:crypto';
import { useReauth } from '../useReauth';
import { ReauthProvider, REAUTH_GRANT_TTL_MS } from '@/contexts/ReauthContext';

const signInMock = vi.fn();
let mockUser: { id?: string; email?: string } | null = null;

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...a: unknown[]) => signInMock(...a),
      mfa: {
        challenge: vi.fn().mockResolvedValue({ data: { id: 'ch' }, error: null }),
        verify: vi.fn().mockResolvedValue({ error: null }),
      },
    },
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/contexts/AuthContext', () => ({ useAuthContext: () => ({ user: mockUser }) }));

const GRANT_KEY = 'reauth_grant:user-1';

function wrapper({ children }: { children: ReactNode }) {
  return <ReauthProvider>{children}</ReauthProvider>;
}

function renderReauth() {
  return renderHook(() => useReauth(), { wrapper });
}

async function verifyOnce(result: { current: ReturnType<typeof useReauth> }) {
  await act(async () => {
    await result.current.verifyWithPassword('senha');
  });
}

describe('Reauth grant persistido (HMAC)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.stubGlobal('crypto', webcrypto);
    mockUser = { id: 'user-1', email: 'ti@promobrindes.com.br' };
    signInMock.mockResolvedValue({ error: null });
  });

  it('grava grant assinado no sessionStorage apos verificar', async () => {
    const { result } = renderReauth();
    await verifyOnce(result);

    const raw = sessionStorage.getItem(GRANT_KEY);
    expect(raw).toBeTruthy();
    const grant = JSON.parse(raw as string);
    expect(grant.userId).toBe('user-1');
    expect(grant.nonce).toBeTruthy();
    expect(grant.signature).not.toBe('unsigned');
    expect(grant.signature).toMatch(/^[0-9a-f]{64}$/);
    expect(grant.expiresAt - grant.verifiedAt).toBe(REAUTH_GRANT_TTL_MS);
  });

  it('rehidrata lastVerified em nova montagem (nao exige reauth)', async () => {
    const first = renderReauth();
    await verifyOnce(first.result);
    first.unmount();

    const second = renderReauth();
    await waitFor(() => expect(second.result.current.needsReauth('change_password')).toBe(false));
    expect(second.result.current.lastVerified).not.toBeNull();
  });

  it('descarta grant com assinatura invalida', async () => {
    const first = renderReauth();
    await verifyOnce(first.result);
    first.unmount();

    const grant = JSON.parse(sessionStorage.getItem(GRANT_KEY) as string);
    grant.verifiedAt = grant.verifiedAt - 1000;
    sessionStorage.setItem(GRANT_KEY, JSON.stringify(grant));

    const second = renderReauth();
    await waitFor(() => expect(sessionStorage.getItem(GRANT_KEY)).toBeNull());
    expect(second.result.current.needsReauth('change_password')).toBe(true);
  });

  it('descarta grant expirado', async () => {
    sessionStorage.setItem(
      GRANT_KEY,
      JSON.stringify({
        userId: 'user-1',
        action: null,
        verifiedAt: Date.now() - REAUTH_GRANT_TTL_MS - 1000,
        expiresAt: Date.now() - 1000,
        nonce: 'abc',
        signature: 'x',
      }),
    );

    const { result } = renderReauth();
    await waitFor(() => expect(sessionStorage.getItem(GRANT_KEY)).toBeNull());
    expect(result.current.needsReauth('change_password')).toBe(true);
  });

  it('ignora grant de outro usuario', async () => {
    const first = renderReauth();
    await verifyOnce(first.result);
    first.unmount();

    mockUser = { id: 'user-2', email: 'outro@promobrindes.com.br' };
    const second = renderReauth();
    expect(second.result.current.needsReauth('change_password')).toBe(true);
  });

  it('executa callback pendente apos verificar com sucesso', async () => {
    const { result } = renderReauth();
    const cb = vi.fn().mockResolvedValue('done');

    let out: string | null = 'x';
    await act(async () => {
      out = await result.current.withReauth('revoke_sessions', cb);
    });
    expect(out).toBeNull();
    expect(cb).not.toHaveBeenCalled();
    expect(result.current.isRequired).toBe(true);

    await verifyOnce(result);

    await waitFor(() => expect(cb).toHaveBeenCalledTimes(1));
    expect(result.current.isRequired).toBe(false);
  });

  it('cancelar limpa callback pendente (nao executa depois)', async () => {
    const { result } = renderReauth();
    const cb = vi.fn().mockResolvedValue('done');

    await act(async () => {
      await result.current.withReauth('admin_action', cb);
    });
    act(() => result.current.cancelReauth());
    await verifyOnce(result);

    expect(cb).not.toHaveBeenCalled();
  });

  it('grant permite segunda acao sensivel sem pedir reauth de novo', async () => {
    const { result } = renderReauth();
    await verifyOnce(result);

    const cb = vi.fn().mockResolvedValue('ok');
    let out: string | null = null;
    await act(async () => {
      out = await result.current.withReauth('delete_account', cb);
    });
    expect(out).toBe('ok');
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('grant de sessao anterior sobrevive a re-render do provider', async () => {
    const first = renderReauth();
    await verifyOnce(first.result);
    first.rerender();

    await waitFor(() => expect(first.result.current.needsReauth('export_data')).toBe(false));
  });
});