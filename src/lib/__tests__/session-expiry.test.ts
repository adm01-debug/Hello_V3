import { describe, it, expect, vi } from 'vitest';
import {
  SESSION_EXPIRED_EVENT,
  isSessionExpiredError,
  notifySessionExpired,
} from '@/lib/session-expiry';

describe('isSessionExpiredError', () => {
  it('reconhece o 401 do fetch do supabase-js', () => {
    expect(isSessionExpiredError({ status: 401, message: 'Unauthorized' })).toBe(true);
  });

  it('reconhece o PGRST301 do PostgREST mesmo sem status', () => {
    expect(isSessionExpiredError({ code: 'PGRST301', message: 'JWT expired' })).toBe(true);
  });

  it('reconhece a mensagem de JWT vencido de edge function', () => {
    expect(isSessionExpiredError({ message: 'invalid JWT: token is expired' })).toBe(true);
  });

  it('não confunde erro de permissão nem falha genérica com sessão expirada', () => {
    expect(isSessionExpiredError({ status: 403, message: 'permission denied' })).toBe(false);
    expect(isSessionExpiredError({ status: 500, message: 'boom' })).toBe(false);
    expect(isSessionExpiredError(new Error('network down'))).toBe(false);
    expect(isSessionExpiredError(null)).toBe(false);
    expect(isSessionExpiredError('JWT expired')).toBe(false);
  });
});

describe('notifySessionExpired', () => {
  it('emite o evento que o provider escuta', () => {
    const listener = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, listener);
    notifySessionExpired();
    window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
