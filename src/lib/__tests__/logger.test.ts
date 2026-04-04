import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to test logger internals, so we'll test the module directly
// but we must control the `isDev` detection

describe('Logger Module', () => {
  let logger: typeof import('@/lib/logger').logger;

  beforeEach(async () => {
    vi.restoreAllMocks();
    // Force localhost so isDev = true and all levels log
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost' },
      writable: true,
    });
    // Re-import to pick up the new hostname
    vi.resetModules();
    const mod = await import('@/lib/logger');
    logger = mod.logger;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic logging methods', () => {
    it('logger.debug calls console.debug', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      logger.debug('test debug');
      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0][0]).toContain('[DEBUG]');
      expect(spy.mock.calls[0][0]).toContain('test debug');
    });

    it('logger.info calls console.info', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
      logger.info('test info');
      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0][0]).toContain('[INFO]');
    });

    it('logger.warn calls console.warn', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logger.warn('test warn');
      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0][0]).toContain('[WARN]');
    });

    it('logger.error calls console.error', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logger.error('test error');
      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0][0]).toContain('[ERROR]');
    });
  });

  describe('Scoped logger via create()', () => {
    it('creates a scoped logger with context prefix', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const scoped = logger.create('MyModule');
      scoped.warn('something happened');
      expect(spy.mock.calls[0][0]).toContain('[MyModule]');
      expect(spy.mock.calls[0][0]).toContain('something happened');
    });

    it('scoped logger has all 4 methods', () => {
      const scoped = logger.create('Test');
      expect(typeof scoped.debug).toBe('function');
      expect(typeof scoped.info).toBe('function');
      expect(typeof scoped.warn).toBe('function');
      expect(typeof scoped.error).toBe('function');
    });
  });

  describe('PII masking', () => {
    it('masks password fields in data', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logger.warn('login attempt', { user: 'test', password: 'secret123' });
      const loggedData = spy.mock.calls[0][1] as Record<string, unknown>;
      expect(loggedData.password).toBe('[REDACTED]');
      expect(loggedData.user).toBe('test');
    });

    it('masks token fields', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logger.warn('auth', { token: 'abc123', name: 'John' });
      const loggedData = spy.mock.calls[0][1] as Record<string, unknown>;
      expect(loggedData.token).toBe('[REDACTED]');
      expect(loggedData.name).toBe('John');
    });

    it('masks nested sensitive keys', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logger.warn('nested', { outer: { authorization: 'Bearer xxx', ok: true } });
      const loggedData = spy.mock.calls[0][1] as Record<string, unknown>;
      const inner = (loggedData as Record<string, unknown>).outer as Record<string, unknown>;
      expect(inner.authorization).toBe('[REDACTED]');
      expect(inner.ok).toBe(true);
    });

    it('masks secret, credential, cookie, session keys', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logger.warn('keys', {
        secret: 'x', credential: 'y', cookie: 'z', session: 'w', key: 'k',
      });
      const loggedData = spy.mock.calls[0][1] as Record<string, unknown>;
      expect(loggedData.secret).toBe('[REDACTED]');
      expect(loggedData.credential).toBe('[REDACTED]');
      expect(loggedData.cookie).toBe('[REDACTED]');
      expect(loggedData.session).toBe('[REDACTED]');
      expect(loggedData.key).toBe('[REDACTED]');
    });

    it('handles arrays in data', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logger.warn('arr', [{ password: 'x' }, { name: 'y' }]);
      const loggedData = spy.mock.calls[0][1] as Array<Record<string, unknown>>;
      expect(loggedData[0].password).toBe('[REDACTED]');
      expect(loggedData[1].name).toBe('y');
    });

    it('handles deeply nested objects (depth > 5)', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const deep = { a: { b: { c: { d: { e: { f: { g: 'val' } } } } } } };
      logger.warn('deep', deep);
      const loggedData = spy.mock.calls[0][1] as Record<string, unknown>;
      expect(loggedData).toBeDefined();
    });

    it('handles null data - preserves null through masking', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logger.warn('null test', null);
      expect(spy.mock.calls[0][1]).toBeNull();
    });

    it('handles primitive data types', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logger.warn('number', 42);
      expect(spy.mock.calls[0][1]).toBe(42);
    });
  });

  describe('Log format', () => {
    it('includes ISO timestamp', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logger.warn('ts test');
      const msg = spy.mock.calls[0][0] as string;
      expect(msg).toMatch(/\d{4}-\d{2}-\d{2}T/);
    });

    it('no data produces single arg (no second argument)', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logger.warn('no data');
      expect(spy.mock.calls[0]).toHaveLength(1);
    });
  });
});
