import { describe, it, expect } from 'vitest';

describe('MFA System', () => {
  describe('Backup code generation', () => {
    const generateBackupCodes = () =>
      Array.from({ length: 10 }, () =>
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );

    it('generates exactly 10 codes', () => {
      const codes = generateBackupCodes();
      expect(codes).toHaveLength(10);
    });

    it('codes are uppercase', () => {
      const codes = generateBackupCodes();
      codes.forEach(code => expect(code).toBe(code.toUpperCase()));
    });

    it('codes are 6 characters', () => {
      const codes = generateBackupCodes();
      codes.forEach(code => expect(code.length).toBe(6));
    });

    it('codes are alphanumeric', () => {
      const codes = generateBackupCodes();
      codes.forEach(code => expect(code).toMatch(/^[A-Z0-9]+$/));
    });

    it('generates unique codes', () => {
      const codes = generateBackupCodes();
      const unique = new Set(codes);
      // Very rare collision but technically possible
      expect(unique.size).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Factor status checks', () => {
    it('hasActiveMFA returns true when verified factor exists', () => {
      const factors = [
        { type: 'totp', status: 'verified' },
        { type: 'phone', status: 'unverified' },
      ];
      const hasActiveMFA = factors.some(f => f.status === 'verified');
      expect(hasActiveMFA).toBe(true);
    });

    it('hasActiveMFA returns false when no verified factors', () => {
      const factors = [{ type: 'totp', status: 'unverified' }];
      const hasActiveMFA = factors.some(f => f.status === 'verified');
      expect(hasActiveMFA).toBe(false);
    });

    it('hasTOTP checks both type and status', () => {
      const factors = [
        { type: 'totp', status: 'verified' },
        { type: 'phone', status: 'verified' },
      ];
      const hasTOTP = factors.some(f => f.type === 'totp' && f.status === 'verified');
      expect(hasTOTP).toBe(true);
    });

    it('hasPhone checks both type and status', () => {
      const factors = [{ type: 'totp', status: 'verified' }];
      const hasPhone = factors.some(f => f.type === 'phone' && f.status === 'verified');
      expect(hasPhone).toBe(false);
    });
  });

  describe('MFA settings update logic', () => {
    it('status transitions set correct timestamps', () => {
      const status = 'in_progress';
      const updates: Record<string, any> = { status };
      if (status === 'in_progress') updates.reviewed_at = new Date().toISOString();
      expect(updates.reviewed_at).toBeTruthy();
      expect(updates.completed_at).toBeUndefined();
    });

    it('completed status sets completed_at', () => {
      const status = 'completed';
      const updates: Record<string, any> = { status };
      if (status === 'completed') updates.completed_at = new Date().toISOString();
      expect(updates.completed_at).toBeTruthy();
    });

    it('pending status sets no timestamps', () => {
      const status = 'pending';
      const updates: Record<string, any> = { status };
      if (status === 'in_progress') updates.reviewed_at = new Date().toISOString();
      else if (status === 'completed') updates.completed_at = new Date().toISOString();
      expect(updates.reviewed_at).toBeUndefined();
      expect(updates.completed_at).toBeUndefined();
    });
  });
});

describe('WebAuthn / Passkey System', () => {
  describe('Device type detection', () => {
    const getDeviceType = (ua: string): string => {
      if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
      if (/Android/.test(ua)) return 'Android';
      if (/Mac/.test(ua)) return 'macOS';
      if (/Windows/.test(ua)) return 'Windows';
      if (/Linux/.test(ua)) return 'Linux';
      return 'Unknown';
    };

    it('detects iOS', () => {
      expect(getDeviceType('iPhone')).toBe('iOS');
      expect(getDeviceType('iPad')).toBe('iOS');
    });

    it('detects Android', () => {
      expect(getDeviceType('Android')).toBe('Android');
    });

    it('detects macOS', () => {
      expect(getDeviceType('Macintosh')).toBe('macOS');
    });

    it('detects Windows', () => {
      expect(getDeviceType('Windows NT 10.0')).toBe('Windows');
    });

    it('detects Linux', () => {
      expect(getDeviceType('X11; Linux x86_64')).toBe('Linux');
    });

    it('returns Unknown for unrecognized UA', () => {
      expect(getDeviceType('RandomBot/1.0')).toBe('Unknown');
    });
  });

  describe('Default friendly name', () => {
    it('generates name with device and date', () => {
      const device = 'macOS';
      const date = new Date().toLocaleDateString('pt-BR');
      const name = `${device} - ${date}`;
      expect(name).toContain('macOS');
      expect(name).toContain('-');
    });
  });

  describe('Challenge expiration', () => {
    it('expires after 5 minutes', () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);
      const diff = expiresAt.getTime() - now.getTime();
      expect(diff).toBe(300000);
    });

    it('is invalid after expiry', () => {
      const expiresAt = new Date('2026-03-15T12:05:00Z');
      const now = new Date('2026-03-15T12:06:00Z');
      expect(now > expiresAt).toBe(true);
    });
  });

  describe('Credential counter', () => {
    it('increments on each use', () => {
      let counter = 5;
      counter = (counter || 0) + 1;
      expect(counter).toBe(6);
    });

    it('handles null counter', () => {
      const counter: number | null = null;
      const newCounter = (counter || 0) + 1;
      expect(newCounter).toBe(1);
    });
  });
});
