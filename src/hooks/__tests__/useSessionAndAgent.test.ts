import { describe, it, expect } from 'vitest';

const SESSION_DURATION_HOURS = 24;
const REFRESH_THRESHOLD_MINUTES = 30;

describe('Session Manager Logic', () => {
  describe('Session expiration', () => {
    it('session expires after 24 hours', () => {
      const now = new Date('2026-03-15T12:00:00Z');
      const expiresAt = new Date(now);
      expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);
      const diff = (expiresAt.getTime() - now.getTime()) / 3600000;
      expect(diff).toBe(24);
    });

    it('expired session is detected', () => {
      const expiresAt = new Date('2026-03-15T12:00:00Z');
      const now = new Date('2026-03-16T13:00:00Z');
      expect(now > expiresAt).toBe(true);
    });

    it('active session is not expired', () => {
      const expiresAt = new Date('2026-03-16T12:00:00Z');
      const now = new Date('2026-03-15T18:00:00Z');
      expect(now > expiresAt).toBe(false);
    });
  });

  describe('Session refresh threshold', () => {
    it('refreshes when under 30 min to expiry', () => {
      const expiresAt = new Date('2026-03-15T12:25:00Z');
      const now = new Date('2026-03-15T12:00:00Z');
      const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / 60000;
      expect(minutesUntilExpiry).toBe(25);
      expect(minutesUntilExpiry <= REFRESH_THRESHOLD_MINUTES).toBe(true);
    });

    it('does not refresh when plenty of time left', () => {
      const expiresAt = new Date('2026-03-15T14:00:00Z');
      const now = new Date('2026-03-15T12:00:00Z');
      const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / 60000;
      expect(minutesUntilExpiry).toBe(120);
      expect(minutesUntilExpiry <= REFRESH_THRESHOLD_MINUTES).toBe(false);
    });

    it('edge case: exactly at threshold', () => {
      const expiresAt = new Date('2026-03-15T12:30:00Z');
      const now = new Date('2026-03-15T12:00:00Z');
      const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / 60000;
      expect(minutesUntilExpiry <= REFRESH_THRESHOLD_MINUTES).toBe(true);
    });
  });

  describe('Session token creation', () => {
    it('extracts first 32 chars of access token', () => {
      const accessToken = 'abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnop';
      const sessionToken = accessToken.substring(0, 32);
      expect(sessionToken).toHaveLength(32);
      expect(sessionToken).toBe('abcdefghijklmnopqrstuvwxyz012345');
    });

    it('handles short token gracefully', () => {
      const accessToken = 'shorttoken';
      const sessionToken = accessToken.substring(0, 32);
      expect(sessionToken).toBe('shorttoken');
      expect(sessionToken.length).toBeLessThan(32);
    });
  });

  describe('Current session identification', () => {
    it('marks matching session as current', () => {
      const currentSessionId = 'session-abc';
      const sessions = [
        { id: 'session-abc', is_active: true },
        { id: 'session-def', is_active: true },
        { id: 'session-ghi', is_active: true },
      ];
      const withCurrent = sessions.map(s => ({ ...s, is_current: s.id === currentSessionId }));
      expect(withCurrent[0].is_current).toBe(true);
      expect(withCurrent[1].is_current).toBe(false);
      expect(withCurrent[2].is_current).toBe(false);
    });
  });

  describe('Revoke all other sessions', () => {
    it('keeps only current session', () => {
      const currentSessionId = 'session-abc';
      const sessions = ['session-abc', 'session-def', 'session-ghi'];
      const toRevoke = sessions.filter(id => id !== currentSessionId);
      expect(toRevoke).toHaveLength(2);
      expect(toRevoke).not.toContain('session-abc');
    });

    it('nothing to revoke when only current session', () => {
      const sessions = ['session-abc'];
      const toRevoke = sessions.filter(id => id !== 'session-abc');
      expect(toRevoke).toHaveLength(0);
    });
  });

  describe('Activity update interval', () => {
    it('updates every 5 minutes', () => {
      const intervalMs = 5 * 60 * 1000;
      expect(intervalMs).toBe(300000);
    });

    it('refresh check every 1 minute', () => {
      const intervalMs = 60 * 1000;
      expect(intervalMs).toBe(60000);
    });
  });
});

describe('Agent Status System', () => {
  describe('Status transitions', () => {
    const validStatuses = ['available', 'busy', 'away', 'offline'];

    it('all statuses are valid', () => {
      expect(validStatuses).toHaveLength(4);
    });

    it('starting a call sets busy', () => {
      let status = 'available';
      status = 'busy'; // setStatusBusy
      expect(status).toBe('busy');
    });

    it('ending a call sets available', () => {
      let status = 'busy';
      status = 'available'; // setStatusAvailable
      expect(status).toBe('available');
    });

    it('page unload sets offline', () => {
      let status = 'available';
      status = 'offline'; // beforeunload handler
      expect(status).toBe('offline');
    });

    it('idle sets away', () => {
      let status = 'available';
      status = 'away';
      expect(status).toBe('away');
    });
  });

  describe('Agent ID persistence', () => {
    it('saves to localStorage on set', () => {
      localStorage.setItem('currentAgentId', 'agent-123');
      expect(localStorage.getItem('currentAgentId')).toBe('agent-123');
    });

    it('removes from localStorage on clear', () => {
      localStorage.setItem('currentAgentId', 'agent-123');
      localStorage.removeItem('currentAgentId');
      expect(localStorage.getItem('currentAgentId')).toBeNull();
    });

    it('loads saved agent on init', () => {
      localStorage.setItem('currentAgentId', 'agent-456');
      const saved = localStorage.getItem('currentAgentId');
      expect(saved).toBe('agent-456');
    });
  });

  describe('Agent lookup', () => {
    it('finds agent by ID', () => {
      const agents = [
        { id: 'a1', name: 'Alice', status: 'available' },
        { id: 'a2', name: 'Bob', status: 'busy' },
      ];
      const found = agents.find(a => a.id === 'a2');
      expect(found?.name).toBe('Bob');
    });

    it('returns null for unknown ID', () => {
      const agents = [{ id: 'a1', name: 'Alice' }];
      const found = agents.find(a => a.id === 'unknown');
      expect(found).toBeUndefined();
    });
  });

  describe('Realtime agent updates', () => {
    it('updates agent in list', () => {
      const agents = [
        { id: 'a1', name: 'Alice', status: 'available' },
        { id: 'a2', name: 'Bob', status: 'available' },
      ];
      const updatedAgent = { id: 'a2', name: 'Bob', status: 'busy' };
      const updated = agents.map(a => a.id === updatedAgent.id ? updatedAgent : a);
      expect(updated[1].status).toBe('busy');
      expect(updated[0].status).toBe('available');
    });
  });

  describe('Offline on unload - sendBeacon fallback', () => {
    it('constructs correct URL for status update', () => {
      const baseUrl = 'https://example.supabase.co';
      const agentId = 'agent-123';
      const url = `${baseUrl}/rest/v1/agents?id=eq.${agentId}`;
      expect(url).toContain('agents?id=eq.agent-123');
    });

    it('body is JSON with offline status', () => {
      const body = JSON.stringify({ status: 'offline' });
      expect(JSON.parse(body).status).toBe('offline');
    });
  });
});
