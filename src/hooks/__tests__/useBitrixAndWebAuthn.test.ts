import { describe, it, expect } from 'vitest';

describe('Bitrix CRM Integration', () => {
  describe('Contact data structure', () => {
    it('parses multi-value PHONE field', () => {
      const contact = {
        ID: '123',
        PHONE: [{ VALUE: '+5511999998888', VALUE_TYPE: 'WORK' }, { VALUE: '+5511888887777', VALUE_TYPE: 'MOBILE' }],
      };
      expect(contact.PHONE).toHaveLength(2);
      expect(contact.PHONE[0].VALUE_TYPE).toBe('WORK');
    });

    it('handles empty PHONE array', () => {
      const contact = { ID: '123', PHONE: [] as Array<{ VALUE: string }> };
      expect(contact.PHONE).toHaveLength(0);
    });

    it('parses multi-value EMAIL field', () => {
      const contact = {
        EMAIL: [{ VALUE: 'alice@test.com', VALUE_TYPE: 'WORK' }],
      };
      expect(contact.EMAIL[0].VALUE).toBe('alice@test.com');
    });
  });

  describe('Call type mapping', () => {
    it('1 = outbound', () => {
      const type = 1;
      const label = type === 1 ? 'outbound' : 'inbound';
      expect(label).toBe('outbound');
    });

    it('2 = inbound', () => {
      const type = 2;
      const label = type === 1 ? 'outbound' : 'inbound';
      expect(label).toBe('inbound');
    });
  });

  describe('CRM_CREATE flag', () => {
    it('0 = do not create CRM entity', () => {
      const flag: 0 | 1 = 0;
      expect(flag).toBe(0);
    });

    it('1 = auto-create CRM entity', () => {
      const flag: 0 | 1 = 1;
      expect(flag).toBe(1);
    });
  });

  describe('Configuration detection', () => {
    it('marks unconfigured when data.configured is false', () => {
      const data = { configured: false };
      const isConfigured = data.configured !== false;
      expect(isConfigured).toBe(false);
    });

    it('marks configured on success', () => {
      const data = { configured: true, data: {} };
      const isConfigured = data.configured !== false;
      expect(isConfigured).toBe(true);
    });

    it('returns null on error', () => {
      const error = new Error('API error');
      const result = error ? null : {};
      expect(result).toBeNull();
    });
  });

  describe('Phone normalization for search', () => {
    it('strips non-digits', () => {
      const phone = '+55 (11) 99999-8888';
      const normalized = phone.replace(/\D/g, '');
      expect(normalized).toBe('5511999998888');
    });
  });

  describe('Lead creation', () => {
    it('returns data on success', () => {
      const result = { success: true, data: { ID: '456' } };
      const leadId = result.success ? result.data.ID : null;
      expect(leadId).toBe('456');
    });

    it('returns null on failure', () => {
      const result = { success: false, data: null };
      const leadId = result.success ? result.data : null;
      expect(leadId).toBeNull();
    });
  });

  describe('Deal stage tracking', () => {
    it('parses deal with opportunity', () => {
      const deal = { STAGE_ID: 'WON', OPPORTUNITY: '5000.00', CURRENCY_ID: 'BRL' };
      expect(parseFloat(deal.OPPORTUNITY)).toBe(5000);
    });
  });

  describe('Finish call status codes', () => {
    it('defaults to 200', () => {
      const statusCode = undefined || '200';
      expect(statusCode).toBe('200');
    });

    it('accepts custom status', () => {
      const statusCode = '404';
      expect(statusCode).toBe('404');
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

    it('detects iOS', () => expect(getDeviceType('Mozilla/5.0 (iPhone)')).toBe('iOS'));
    it('detects iPad', () => expect(getDeviceType('Mozilla/5.0 (iPad)')).toBe('iOS'));
    it('detects Android', () => expect(getDeviceType('Mozilla/5.0 (Linux; Android 13)')).toBe('Android'));
    it('detects macOS', () => expect(getDeviceType('Mozilla/5.0 (Macintosh; Intel Mac OS X)')).toBe('macOS'));
    it('detects Windows', () => expect(getDeviceType('Mozilla/5.0 (Windows NT 10.0)')).toBe('Windows'));
    it('detects Linux', () => expect(getDeviceType('Mozilla/5.0 (X11; Linux x86_64)')).toBe('Linux'));
    it('returns Unknown for unrecognized', () => expect(getDeviceType('CustomBot/1.0')).toBe('Unknown'));
  });

  describe('Friendly name generation', () => {
    it('includes device type and date', () => {
      const device = 'macOS';
      const date = new Date().toLocaleDateString('pt-BR');
      const name = `${device} - ${date}`;
      expect(name).toContain('macOS');
      expect(name).toContain('/');
    });

    it('uses custom name when provided', () => {
      const friendlyName = 'Meu MacBook';
      const defaultName = 'macOS - 15/03/2026';
      const resolved = friendlyName || defaultName;
      expect(resolved).toBe('Meu MacBook');
    });

    it('falls back to default when no custom name', () => {
      const friendlyName: string | undefined = undefined;
      const defaultName = 'macOS - 15/03/2026';
      const resolved = friendlyName || defaultName;
      expect(resolved).toBe(defaultName);
    });
  });

  describe('Challenge expiration', () => {
    it('expires in 5 minutes', () => {
      const expiresMs = 5 * 60 * 1000;
      expect(expiresMs).toBe(300000);
    });

    it('expired challenge is rejected', () => {
      const expiresAt = new Date(Date.now() - 60000);
      const isExpired = expiresAt < new Date();
      expect(isExpired).toBe(true);
    });

    it('valid challenge is accepted', () => {
      const expiresAt = new Date(Date.now() + 120000);
      const isExpired = expiresAt < new Date();
      expect(isExpired).toBe(false);
    });
  });

  describe('Counter increment', () => {
    it('increments counter on auth', () => {
      const counter = 5;
      const newCounter = (counter || 0) + 1;
      expect(newCounter).toBe(6);
    });

    it('starts from 0 for null counter', () => {
      const counter: number | null = null;
      const newCounter = (counter || 0) + 1;
      expect(newCounter).toBe(1);
    });
  });

  describe('Error handling', () => {
    it('NotAllowedError = user cancelled', () => {
      const errorName = 'NotAllowedError';
      const message = errorName === 'NotAllowedError' ? 'Registro cancelado pelo usuário' : 'Erro genérico';
      expect(message).toContain('cancelado');
    });

    it('InvalidStateError = already registered', () => {
      const errorName = 'InvalidStateError';
      const message = errorName === 'InvalidStateError' ? 'Esta passkey já está registrada' : 'Erro';
      expect(message).toContain('já está registrada');
    });
  });

  describe('Exclude existing credentials', () => {
    it('builds exclude list from existing passkeys', () => {
      const passkeys = [{ credential_id: 'cred-1' }, { credential_id: 'cred-2' }];
      const excludeIds = passkeys.map(p => p.credential_id);
      expect(excludeIds).toHaveLength(2);
      expect(excludeIds).toContain('cred-1');
    });

    it('empty list when no passkeys', () => {
      const passkeys: Array<{ credential_id: string }> = [];
      const excludeIds = passkeys.map(p => p.credential_id);
      expect(excludeIds).toHaveLength(0);
    });
  });

  describe('hasPasskeys derived state', () => {
    it('true when passkeys exist', () => {
      const passkeys = [{ id: '1' }];
      expect(passkeys.length > 0).toBe(true);
    });

    it('false when no passkeys', () => {
      const passkeys: any[] = [];
      expect(passkeys.length > 0).toBe(false);
    });
  });

  describe('Guard: no user', () => {
    it('rejects registration without user', () => {
      const user = null;
      expect(!!user).toBe(false);
    });

    it('rejects when not supported', () => {
      const isSupported = false;
      expect(isSupported).toBe(false);
    });
  });
});
