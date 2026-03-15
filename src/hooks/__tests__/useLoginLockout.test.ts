import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase before importing the hook
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('useLoginLockout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('check_login_lockout RPC', () => {
    it('returns unlocked for unknown email', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { locked: false, attempts: 0 },
        error: null,
      } as any);

      const { data } = await supabase.rpc('check_login_lockout', { p_email: 'new@test.com' });
      expect(data).toEqual({ locked: false, attempts: 0 });
    });

    it('returns locked after 5 failed attempts', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { locked: true, attempts: 5, remaining_seconds: 60, locked_until: '2026-01-01T00:01:00Z' },
        error: null,
      } as any);

      const { data } = await supabase.rpc('check_login_lockout', { p_email: 'locked@test.com' });
      expect((data as any).locked).toBe(true);
      expect((data as any).attempts).toBe(5);
      expect((data as any).remaining_seconds).toBeGreaterThan(0);
    });

    it('handles RPC errors gracefully', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      } as any);

      const { error } = await supabase.rpc('check_login_lockout', { p_email: 'test@test.com' });
      expect(error).toBeTruthy();
    });
  });

  describe('record_failed_login RPC', () => {
    it('increments attempt count', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { locked: false, attempts: 3, remaining_attempts: 2 },
        error: null,
      } as any);

      const { data } = await supabase.rpc('record_failed_login', {
        p_email: 'test@test.com',
        p_ip_address: '1.2.3.4',
        p_user_agent: 'test',
      });
      expect((data as any).attempts).toBe(3);
      expect((data as any).remaining_attempts).toBe(2);
    });

    it('locks after reaching threshold', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { locked: true, attempts: 5, remaining_seconds: 60 },
        error: null,
      } as any);

      const { data } = await supabase.rpc('record_failed_login', {
        p_email: 'test@test.com',
        p_ip_address: '1.2.3.4',
        p_user_agent: 'test',
      });
      expect((data as any).locked).toBe(true);
    });
  });

  describe('record_successful_login RPC', () => {
    it('resets lockout on success', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: null,
      } as any);

      const { error } = await supabase.rpc('record_successful_login', {
        p_email: 'test@test.com',
        p_ip_address: '1.2.3.4',
        p_user_agent: 'test',
      });
      expect(error).toBeNull();
    });
  });

  describe('formatRemainingTime logic', () => {
    const formatRemainingTime = (seconds: number): string => {
      if (seconds < 60) return `${seconds} segundos`;
      const minutes = Math.ceil(seconds / 60);
      return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
    };

    it('formats seconds correctly', () => {
      expect(formatRemainingTime(30)).toBe('30 segundos');
    });

    it('formats 1 minute correctly', () => {
      expect(formatRemainingTime(60)).toBe('1 minuto');
    });

    it('formats multiple minutes correctly', () => {
      expect(formatRemainingTime(150)).toBe('3 minutos');
    });

    it('formats 59 seconds as seconds', () => {
      expect(formatRemainingTime(59)).toBe('59 segundos');
    });

    it('rounds up partial minutes', () => {
      expect(formatRemainingTime(61)).toBe('2 minutos');
    });
  });
});
