import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLoginLockout } from '../useLoginLockout';

type RpcResult = { data: unknown; error: { message: string } | null };

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const rpc = vi.mocked(supabase.rpc);

describe('useLoginLockout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('checkLockout success returns parsed status', async () => {
    rpc.mockResolvedValueOnce({
      data: { locked: true, attempts: 5, remaining_seconds: 120, locked_until: '2026-06-14T12:00:00Z' },
      error: null,
    } as RpcResult as never);
    const { result } = renderHook(() => useLoginLockout());
    let status;
    await act(async () => { status = await result.current.checkLockout('USER@EXAMPLE.COM'); });
    expect(status).toMatchObject({ locked: true, attempts: 5, remainingSeconds: 120 });
    expect(rpc).toHaveBeenCalledWith('check_login_lockout', { p_email: 'user@example.com' });
    expect(result.current.isChecking).toBe(false);
  });

  it('checkLockout handles error from rpc', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'bad' } } as RpcResult as never);
    const { result } = renderHook(() => useLoginLockout());
    let status;
    await act(async () => { status = await result.current.checkLockout('a@b.com'); });
    expect(status).toEqual({ locked: false, attempts: 0 });
    expect(logger.error).toHaveBeenCalled();
  });

  it('checkLockout handles thrown exception', async () => {
    rpc.mockRejectedValueOnce(new Error('network'));
    const { result } = renderHook(() => useLoginLockout());
    let status;
    await act(async () => { status = await result.current.checkLockout('a@b.com'); });
    expect(status).toEqual({ locked: false, attempts: 0 });
  });

  it('recordFailedAttempt success', async () => {
    rpc.mockResolvedValueOnce({
      data: { locked: false, attempts: 2, remaining_attempts: 3, remaining_seconds: 0 },
      error: null,
    } as RpcResult as never);
    const { result } = renderHook(() => useLoginLockout());
    let status;
    await act(async () => { status = await result.current.recordFailedAttempt('a@b.com', '1.2.3.4'); });
    expect(status).toMatchObject({ attempts: 2, remainingAttempts: 3 });
  });

  it('recordFailedAttempt error branch', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'fail' } } as RpcResult as never);
    const { result } = renderHook(() => useLoginLockout());
    let status;
    await act(async () => { status = await result.current.recordFailedAttempt('a@b.com'); });
    expect(status).toEqual({ locked: false, attempts: 0 });
  });

  it('recordFailedAttempt thrown exception', async () => {
    rpc.mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => useLoginLockout());
    let status;
    await act(async () => { status = await result.current.recordFailedAttempt('a@b.com'); });
    expect(status).toEqual({ locked: false, attempts: 0 });
  });

  it('recordSuccessfulLogin resets status', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: null } as RpcResult as never);
    const { result } = renderHook(() => useLoginLockout());
    await act(async () => { await result.current.recordSuccessfulLogin('a@b.com', '1.2.3.4'); });
    expect(result.current.lockoutStatus).toBeNull();
  });

  it('recordSuccessfulLogin swallows exceptions', async () => {
    rpc.mockRejectedValueOnce(new Error('oops'));
    const { result } = renderHook(() => useLoginLockout());
    await act(async () => { await result.current.recordSuccessfulLogin('a@b.com'); });
    expect(logger.error).toHaveBeenCalled();
  });

  it('formatRemainingTime formats seconds and minutes', () => {
    const { result } = renderHook(() => useLoginLockout());
    expect(result.current.formatRemainingTime(30)).toBe('30 segundos');
    expect(result.current.formatRemainingTime(60)).toBe('1 minuto');
    expect(result.current.formatRemainingTime(125)).toBe('3 minutos');
  });
});
