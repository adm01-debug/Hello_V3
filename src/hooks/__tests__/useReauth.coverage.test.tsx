import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useReauth } from '../useReauth';

const signInMock = vi.fn();
const challengeMock = vi.fn();
const verifyMock = vi.fn();
let mockUser: { email?: string } | null = { email: 'ti@promobrindes.com.br' };

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => (signInMock as (...a: unknown[]) => unknown)(...args),
      mfa: {
        challenge: (...args: unknown[]) => (challengeMock as (...a: unknown[]) => unknown)(...args),
        verify: (...args: unknown[]) => (verifyMock as (...a: unknown[]) => unknown)(...args),
      },
    },
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/contexts/AuthContext', () => ({ useAuthContext: () => ({ user: mockUser }) }));

describe('useReauth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { email: 'ti@promobrindes.com.br' };
    signInMock.mockResolvedValue({ error: null });
    challengeMock.mockResolvedValue({ data: { id: 'ch1' }, error: null });
    verifyMock.mockResolvedValue({ error: null });
  });

  it('needsReauth true sem verificação prévia', () => {
    const { result } = renderHook(() => useReauth());
    expect(result.current.needsReauth('change_password')).toBe(true);
  });

  it('requestReauth marca isRequired', () => {
    const { result } = renderHook(() => useReauth());
    let ret = false;
    act(() => { ret = result.current.requestReauth('admin_action'); });
    expect(ret).toBe(true);
    expect(result.current.isRequired).toBe(true);
    expect(result.current.action).toBe('admin_action');
  });

  it('verifyWithPassword sucesso atualiza lastVerified e dispensa reauth', async () => {
    const { result } = renderHook(() => useReauth());
    let ok = false;
    await act(async () => { ok = await result.current.verifyWithPassword('senha'); });
    expect(ok).toBe(true);
    await waitFor(() => expect(result.current.lastVerified).not.toBeNull());
    expect(result.current.needsReauth('change_email')).toBe(false);
    // requestReauth retorna false agora
    let ret = true;
    act(() => { ret = result.current.requestReauth('change_email'); });
    expect(ret).toBe(false);
  });

  it('verifyWithPassword falha quando supabase retorna erro', async () => {
    signInMock.mockResolvedValue({ error: new Error('bad') });
    const { result } = renderHook(() => useReauth());
    let ok = true;
    await act(async () => { ok = await result.current.verifyWithPassword('x'); });
    expect(ok).toBe(false);
  });

  it('verifyWithPassword retorna false sem email', async () => {
    mockUser = {};
    const { result } = renderHook(() => useReauth());
    let ok = true;
    await act(async () => { ok = await result.current.verifyWithPassword('x'); });
    expect(ok).toBe(false);
  });

  it('verifyWithPassword captura exceção', async () => {
    signInMock.mockRejectedValue(new Error('throw'));
    const { result } = renderHook(() => useReauth());
    let ok = true;
    await act(async () => { ok = await result.current.verifyWithPassword('x'); });
    expect(ok).toBe(false);
  });

  it('verifyWithMFA sucesso', async () => {
    const { result } = renderHook(() => useReauth());
    let ok = false;
    await act(async () => { ok = await result.current.verifyWithMFA('f1', '123456'); });
    expect(ok).toBe(true);
  });

  it('verifyWithMFA falha no challenge', async () => {
    challengeMock.mockResolvedValue({ data: null, error: new Error('challenge fail') });
    const { result } = renderHook(() => useReauth());
    let ok = true;
    await act(async () => { ok = await result.current.verifyWithMFA('f1', '000') ; });
    expect(ok).toBe(false);
  });

  it('verifyWithMFA falha na verificação', async () => {
    verifyMock.mockResolvedValue({ error: new Error('verify fail') });
    const { result } = renderHook(() => useReauth());
    let ok = true;
    await act(async () => { ok = await result.current.verifyWithMFA('f1', '000'); });
    expect(ok).toBe(false);
  });

  it('verifyWithMFA captura exceção', async () => {
    challengeMock.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useReauth());
    let ok = true;
    await act(async () => { ok = await result.current.verifyWithMFA('f1', '000'); });
    expect(ok).toBe(false);
  });

  it('cancelReauth limpa estado', () => {
    const { result } = renderHook(() => useReauth());
    act(() => { result.current.requestReauth('export_data'); });
    act(() => { result.current.cancelReauth(); });
    expect(result.current.isRequired).toBe(false);
    expect(result.current.action).toBeNull();
  });

  it('withReauth executa callback quando não precisa reauth', async () => {
    const { result } = renderHook(() => useReauth());
    await act(async () => { await result.current.verifyWithPassword('senha'); });
    const cb = vi.fn().mockResolvedValue('done');
    let out: string | null = null;
    await act(async () => { out = await result.current.withReauth('delete_account', cb); });
    expect(out).toBe('done');
    expect(cb).toHaveBeenCalled();
  });

  it('withReauth dispara reauth e retorna null quando necessário', async () => {
    const { result } = renderHook(() => useReauth());
    const cb = vi.fn().mockResolvedValue('done');
    let out: string | null = 'x';
    await act(async () => { out = await result.current.withReauth('revoke_sessions', cb); });
    expect(out).toBeNull();
    expect(cb).not.toHaveBeenCalled();
    expect(result.current.isRequired).toBe(true);
  });
});
