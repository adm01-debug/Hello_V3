import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMFAStatus, generateBackupCodes, formatBackupCode } from '../index';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

type MaybeSingleResult = { data: unknown };
function mockMaybeSingle(result: MaybeSingleResult) {
  (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  });
}

describe('mfa (coverage)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns disabled default when no settings row', async () => {
    mockMaybeSingle({ data: null });
    const status = await getMFAStatus('user-1');
    expect(status).toEqual({ enabled: false, method: null, lastVerified: null, hasBackupCodes: false });
  });

  it('maps existing settings row including backup codes', async () => {
    mockMaybeSingle({
      data: {
        mfa_enabled: true,
        mfa_method: 'totp',
        last_verified_at: '2026-01-01T00:00:00Z',
        backup_codes: ['a', 'b'],
      },
    });
    const status = await getMFAStatus('user-2');
    expect(status.enabled).toBe(true);
    expect(status.method).toBe('totp');
    expect(status.lastVerified).toBe('2026-01-01T00:00:00Z');
    expect(status.hasBackupCodes).toBe(true);
  });

  it('handles settings row with falsy/missing fields', async () => {
    mockMaybeSingle({ data: { mfa_enabled: false, mfa_method: null, last_verified_at: null } });
    const status = await getMFAStatus('user-3');
    expect(status.enabled).toBe(false);
    expect(status.hasBackupCodes).toBe(false);
  });

  it('generateBackupCodes produces the requested count of formatted codes', () => {
    const codes = generateBackupCodes(5);
    expect(codes).toHaveLength(5);
    codes.forEach((c) => expect(c).toMatch(/^[0-9a-f]{4}-[0-9a-f]{4}$/));
  });

  it('generateBackupCodes defaults to 10', () => {
    expect(generateBackupCodes()).toHaveLength(10);
  });

  it('formatBackupCode inserts dashes every 4 chars', () => {
    expect(formatBackupCode('abcdefgh')).toBe('abcd-efgh');
  });
});
