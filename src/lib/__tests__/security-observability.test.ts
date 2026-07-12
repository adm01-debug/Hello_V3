import { describe, it, expect, vi, beforeEach, beforeAll, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * SECURITY & OBSERVABILITY TEST SUITE
 * Validates: Logger PII masking, security modules, edge function hardening
 */

function readSrc(filePath: string): string {
  return fs.readFileSync(path.resolve(__dirname, '../../..', filePath), 'utf-8');
}

describe('Security: Logger PII masking (comprehensive)', () => {
  let logger: typeof import('@/lib/logger').logger;

  beforeEach(async () => {
    vi.resetModules();
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost' },
      writable: true,
    });
    const mod = await import('@/lib/logger');
    logger = mod.logger;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'cookie', 'session', 'key', 'credential'];

  sensitiveKeys.forEach((key) => {
    it(`masks "${key}" field`, () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logger.warn('test', { [key]: 'sensitive_value' });
      const data = spy.mock.calls[0][1] as Record<string, unknown>;
      expect(data[key]).toBe('[REDACTED]');
    });
  });

  it('masks case-insensitive keys (Password, TOKEN, etc.)', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('test', { Password: 'x', TOKEN: 'y', apiKey: 'z' });
    const data = spy.mock.calls[0][1] as Record<string, unknown>;
    expect(data.Password).toBe('[REDACTED]');
    expect(data.TOKEN).toBe('[REDACTED]');
    expect(data.apiKey).toBe('[REDACTED]');
  });

  it('preserves non-sensitive fields', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('test', { name: 'John', email: 'john@test.com', age: 30 });
    const data = spy.mock.calls[0][1] as Record<string, unknown>;
    expect(data.name).toBe('John');
    expect(data.email).toBe('john@test.com');
    expect(data.age).toBe(30);
  });

  it('masks nested objects recursively', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('test', {
      user: {
        name: 'Alice',
        auth: {
          password: 'secret',
          token: 'abc123',
        },
      },
    });
    const data = spy.mock.calls[0][1] as {
      user: { name: string; auth: { password: string; token: string } };
    };
    expect(data.user.name).toBe('Alice');
    expect(data.user.auth.password).toBe('[REDACTED]');
    expect(data.user.auth.token).toBe('[REDACTED]');
  });

  it('handles arrays with sensitive objects', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('test', [
      { id: 1, password: 'x' },
      { id: 2, token: 'y' },
    ]);
    const data = spy.mock.calls[0][1] as Array<{ id: number; password?: string; token?: string }>;
    expect(data[0].id).toBe(1);
    expect(data[0].password).toBe('[REDACTED]');
    expect(data[1].token).toBe('[REDACTED]');
  });

  it('handles depth > 5 gracefully', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const deep = { a: { b: { c: { d: { e: { f: { password: 'x' } } } } } } };
    logger.warn('deep', deep);
    expect(spy).toHaveBeenCalled();
    // Should not crash
  });

  it('handles null, undefined, primitives without crash', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('null', null);
    logger.warn('number', 42);
    logger.warn('string', 'hello');
    logger.warn('boolean', true);
    expect(spy).toHaveBeenCalledTimes(4);
  });
});

describe('Security: Edge function hardening', () => {
  const hardenedFunctions = [
    'supabase/functions/database-backup/index.ts',
    'supabase/functions/database-cleanup/index.ts',
    'supabase/functions/process-digest/index.ts',
    'supabase/functions/check-goals/index.ts',
    'supabase/functions/check-queue-metrics/index.ts',
  ];

  hardenedFunctions.forEach((funcPath) => {
    describe(`Edge function: ${funcPath.split('/')[2]}`, () => {
      let content: string;

      beforeAll(() => {
        try {
          content = readSrc(funcPath);
        } catch {
          content = '';
        }
      });

      it('file exists', () => {
        expect(content.length).toBeGreaterThan(0);
      });

      it('handles CORS OPTIONS requests', () => {
        if (content) {
          expect(content).toContain('OPTIONS');
        }
      });

      it('has error handling', () => {
        if (content) {
          expect(content.toLowerCase()).toMatch(/catch|error|try/);
        }
      });
    });
  });
});

describe('Security: Input sanitization modules exist', () => {
  const securityModules = [
    'src/lib/security/input-sanitizer.ts',
    'src/lib/security/sql-sanitizer.ts',
    'src/lib/security/xss-prevention.ts',
    'src/lib/security/rate-limiter.ts',
    'src/lib/security/csrf-token.ts',
    'src/lib/security/encryption.ts',
    'src/lib/security/jwt-handler.ts',
  ];

  securityModules.forEach((mod) => {
    it(`${mod} exists`, () => {
      const exists = fs.existsSync(path.resolve(__dirname, '../../..', mod));
      expect(exists).toBe(true);
    });
  });
});

describe('Security: Logger module structure', () => {
  let content: string;

  beforeAll(() => {
    content = readSrc('src/lib/logger.ts');
  });

  it('defines SENSITIVE_KEYS regex pattern', () => {
    expect(content).toContain('SENSITIVE_KEYS');
    expect(content).toContain('password');
    expect(content).toContain('token');
    expect(content).toContain('secret');
  });

  it('has maskSensitive function', () => {
    expect(content).toContain('function maskSensitive');
  });

  it('masks deep objects with depth limit', () => {
    expect(content).toContain('depth > 5');
    expect(content).toContain('[deep object]');
  });

  it('has log level filtering', () => {
    expect(content).toContain('LOG_LEVELS');
    expect(content).toContain('shouldLog');
  });

  it('suppresses debug/info in production', () => {
    expect(content).toContain('MIN_LEVEL');
    expect(content).toContain("isDev ? 'debug' : 'warn'");
  });

  it('exports createLogger for scoped logging', () => {
    expect(content).toContain('createLogger');
    expect(content).toContain('create: createLogger');
  });

  it('uses undefined check (not falsy) for data parameter', () => {
    expect(content).toContain('data !== undefined');
  });
});

describe('Observability: Error tracking module structure', () => {
  let content: string;

  beforeAll(() => {
    content = readSrc('src/lib/error-tracking.ts');
  });

  it('defines ErrorReport interface', () => {
    expect(content).toContain('interface ErrorReport');
  });

  it('has message, stack, timestamp fields', () => {
    expect(content).toContain('message: string');
    expect(content).toContain('stack?: string');
    expect(content).toContain('timestamp: number');
  });

  it('has error buffer with max size', () => {
    expect(content).toContain('ERROR_BUFFER');
    expect(content).toContain('MAX_BUFFER');
  });

  it('implements circular buffer (shift when full)', () => {
    expect(content).toContain('ERROR_BUFFER.shift()');
  });

  it('listens for window error events', () => {
    expect(content).toContain("addEventListener('error'");
  });

  it('listens for unhandled rejections', () => {
    expect(content).toContain("addEventListener('unhandledrejection'");
  });

  it('exports getErrorReports returning a copy', () => {
    expect(content).toContain('[...ERROR_BUFFER]');
  });
});

describe('Observability: Vite config optimizations', () => {
  let content: string;

  beforeAll(() => {
    content = readSrc('vite.config.ts');
  });

  it('has production build optimization', () => {
    expect(content).toContain('build:');
  });

  it('uses rollup manual chunks', () => {
    expect(content).toContain('manualChunks');
  });

  it('separates vendor bundles', () => {
    expect(content).toContain('vendor-react');
    expect(content).toContain('vendor-radix');
    expect(content).toContain('vendor-charts');
  });

});
