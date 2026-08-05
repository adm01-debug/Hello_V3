import { describe, it, expect, vi, beforeEach } from 'vitest';

const invoke = vi.fn();
const insert = vi.fn();
const from = vi.fn(() => ({ insert }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: (...a: unknown[]) => (invoke as (...args: unknown[]) => unknown)(...a) },
    from: (...a: unknown[]) => (from as (...args: unknown[]) => unknown)(...a),
  },
}));

import {
  sendNotification,
  sendLocalNotification,
  validateNotification,
} from '../index';

const base = { userId: 'u1', title: 'Hi', message: 'There' };

describe('notifications', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('sendNotification', () => {
    it('returns success when edge function succeeds', async () => {
      invoke.mockResolvedValue({ data: { id: 'n1' }, error: null });
      const res = await sendNotification(base);
      expect(res.success).toBe(true);
      expect(invoke).toHaveBeenCalledWith('send-notification', expect.any(Object));
    });

    it('returns error when edge function returns error', async () => {
      invoke.mockResolvedValue({ data: null, error: { message: 'fail' } });
      const res = await sendNotification({ ...base, category: 'call', severity: 'warning', type: 'x' });
      expect(res).toEqual({ success: false, error: 'fail' });
    });

    it('returns error when invoke throws', async () => {
      invoke.mockRejectedValue(new Error('boom'));
      const res = await sendNotification(base);
      expect(res).toEqual({ success: false, error: 'Falha ao enviar notificação' });
    });
  });

  describe('sendLocalNotification', () => {
    it('returns true when insert succeeds', async () => {
      insert.mockResolvedValue({ error: null });
      const ok = await sendLocalNotification({ ...base, metadata: { a: 1 } });
      expect(ok).toBe(true);
      expect(from).toHaveBeenCalledWith('notifications');
    });

    it('returns false when insert fails', async () => {
      insert.mockResolvedValue({ error: { message: 'nope' } });
      const ok = await sendLocalNotification(base);
      expect(ok).toBe(false);
    });
  });

  describe('validateNotification', () => {
    it('returns no errors for valid params', () => {
      expect(validateNotification(base)).toEqual([]);
    });

    it('flags missing required fields', () => {
      const errs = validateNotification({});
      expect(errs).toContain('userId é obrigatório');
      expect(errs).toContain('title é obrigatório');
      expect(errs).toContain('message é obrigatório');
    });

    it('flags whitespace-only title/message', () => {
      const errs = validateNotification({ userId: 'u', title: '   ', message: '  ' });
      expect(errs).toContain('title é obrigatório');
      expect(errs).toContain('message é obrigatório');
    });

    it('flags overly long title and message', () => {
      const errs = validateNotification({
        userId: 'u',
        title: 'a'.repeat(201),
        message: 'b'.repeat(2001),
      });
      expect(errs.some((e) => e.includes('title deve ter'))).toBe(true);
      expect(errs.some((e) => e.includes('message deve ter'))).toBe(true);
    });

    it('flags invalid category and severity', () => {
      const errs = validateNotification({
        ...base,
        category: 'bogus' as never,
        severity: 'bogus' as never,
      });
      expect(errs.some((e) => e.includes('category deve ser'))).toBe(true);
      expect(errs.some((e) => e.includes('severity deve ser'))).toBe(true);
    });
  });
});
