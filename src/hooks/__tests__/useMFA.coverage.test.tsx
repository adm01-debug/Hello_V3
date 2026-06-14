import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMFA } from '../useMFA';

interface Res { data: unknown; error: unknown }
const { mfa, upsertFn } = vi.hoisted(() => ({
  mfa: {
    listFactors: vi.fn(),
    enroll: vi.fn(),
    challenge: vi.fn(),
    verify: vi.fn(),
    unenroll: vi.fn(),
  },
  upsertFn: vi.fn().mockResolvedValue({ error: null }),
}));
let settingsRow: Res = { data: { mfa_enabled: true, mfa_method: 'totp', backup_codes: ['x'], last_verified_at: 't', recovery_email: 'e' }, error: null };

const stableUser = { id: 'u1', email: 'u@e.com' };
vi.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => ({ user: stableUser }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { mfa },
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn(() => Promise.resolve(settingsRow)) })) })),
      upsert: (...a: unknown[]) => upsertFn(...a),
    })),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

describe('useMFA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settingsRow = { data: { mfa_enabled: true, mfa_method: 'totp', backup_codes: ['x'], last_verified_at: 't', recovery_email: 'e' }, error: null };
    mfa.listFactors.mockResolvedValue({ data: { totp: [{ id: 'f1', status: 'verified' }], phone: [{ id: 'f2', status: 'verified' }] }, error: null });
    mfa.enroll.mockResolvedValue({ data: { id: 'f1', totp: { qr_code: 'qr', secret: 'sec' } }, error: null });
    mfa.challenge.mockResolvedValue({ data: { id: 'ch1' }, error: null });
    mfa.verify.mockResolvedValue({ data: {}, error: null });
    mfa.unenroll.mockResolvedValue({ data: {}, error: null });
    upsertFn.mockResolvedValue({ error: null });
  });

  it('loads factors and settings', async () => {
    const { result } = renderHook(() => useMFA());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.factors.length).toBe(2);
    expect(result.current.hasActiveMFA).toBe(true);
    expect(result.current.hasTOTP).toBe(true);
    expect(result.current.hasPhone).toBe(true);
    expect(result.current.settings?.mfa_enabled).toBe(true);
  });

  it('enrollTOTP success and error', async () => {
    const { result } = renderHook(() => useMFA());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let r: unknown;
    await act(async () => { r = await result.current.enrollTOTP('My App'); });
    expect((r as { secret: string }).secret).toBe('sec');
    mfa.enroll.mockResolvedValueOnce({ data: null, error: new Error('fail') });
    await act(async () => { r = await result.current.enrollTOTP(); });
    expect(r).toBeNull();
  });

  it('enrollPhone success and error', async () => {
    mfa.enroll.mockResolvedValue({ data: { id: 'p1' }, error: null });
    const { result } = renderHook(() => useMFA());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let r: unknown;
    await act(async () => { r = await result.current.enrollPhone('+1555'); });
    expect((r as { factorId: string }).factorId).toBe('p1');
    mfa.enroll.mockResolvedValueOnce({ data: null, error: new Error('x') });
    await act(async () => { r = await result.current.enrollPhone('+1555'); });
    expect(r).toBeNull();
  });

  it('verifyFactor success and error', async () => {
    const { result } = renderHook(() => useMFA());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.verifyFactor('f1', '123456'); });
    expect(ok).toBe(true);
    mfa.challenge.mockResolvedValueOnce({ data: null, error: new Error('bad') });
    await act(async () => { ok = await result.current.verifyFactor('f1', '000'); });
    expect(ok).toBe(false);
  });

  it('unenrollFactor success and error', async () => {
    const { result } = renderHook(() => useMFA());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.unenrollFactor('f1'); });
    expect(ok).toBe(true);
    mfa.unenroll.mockResolvedValueOnce({ data: null, error: new Error('x') });
    await act(async () => { ok = await result.current.unenrollFactor('f1'); });
    expect(ok).toBe(false);
  });

  it('generateBackupCodes returns 10 codes', async () => {
    const { result } = renderHook(() => useMFA());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const codes = result.current.generateBackupCodes();
    expect(codes.length).toBe(10);
  });

  it('saveSettings success and error', async () => {
    const { result } = renderHook(() => useMFA());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.saveSettings({ mfa_enabled: true }); });
    expect(ok).toBe(true);
    upsertFn.mockResolvedValueOnce({ error: new Error('fail') });
    await act(async () => { ok = await result.current.saveSettings({ mfa_enabled: false }); });
    expect(ok).toBe(false);
  });

  it('handles null settings and listFactors error', async () => {
    settingsRow = { data: null, error: null };
    mfa.listFactors.mockResolvedValue({ data: null, error: new Error('lf') });
    const { result } = renderHook(() => useMFA());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.settings).toBeNull();
    expect(result.current.hasActiveMFA).toBe(false);
  });
});
