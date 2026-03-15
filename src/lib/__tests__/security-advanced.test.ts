import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkRateLimit,
  resetRateLimit,
  clearAllRateLimits,
  DEFAULT_RATE_LIMIT,
} from '@/lib/security/rate-limiter';
import {
  generateCSRFToken,
  getOrCreateCSRFToken,
  validateCSRFToken,
  rotateCSRFToken,
} from '@/lib/security/csrf-token';
import {
  isKeyExpired,
  shouldRotateKey,
  generateRotationSchedule,
  createKeyConfig,
  DEFAULT_ROTATION_INTERVAL_DAYS,
  ApiKeyConfig,
} from '@/lib/security/api-key-rotation';
import {
  scanForSecrets,
  maskSecret,
} from '@/lib/security/secrets-scanner';
import {
  getSecurityScore,
  HeaderValidationResult,
} from '@/lib/security/security-headers-validator';

describe('Rate Limiter', () => {
  beforeEach(() => clearAllRateLimits());

  it('allows requests within limit', () => {
    const result = checkRateLimit('test-key', { maxRequests: 5, windowMs: 60000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('tracks remaining requests accurately', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('counter', { maxRequests: 5, windowMs: 60000 });
    }
    const result = checkRateLimit('counter', { maxRequests: 5, windowMs: 60000 });
    expect(result.remaining).toBe(1);
  });

  it('blocks when limit exceeded', () => {
    const config = { maxRequests: 3, windowMs: 60000 };
    checkRateLimit('block-test', config);
    checkRateLimit('block-test', config);
    checkRateLimit('block-test', config);
    const result = checkRateLimit('block-test', config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('provides resetAt timestamp', () => {
    const result = checkRateLimit('reset', { maxRequests: 10, windowMs: 60000 });
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it('isolates different keys', () => {
    const config = { maxRequests: 1, windowMs: 60000 };
    checkRateLimit('key-a', config);
    const result = checkRateLimit('key-b', config);
    expect(result.allowed).toBe(true);
  });

  it('resets a specific key', () => {
    const config = { maxRequests: 1, windowMs: 60000 };
    checkRateLimit('reset-key', config);
    resetRateLimit('reset-key');
    const result = checkRateLimit('reset-key', config);
    expect(result.allowed).toBe(true);
  });

  it('clearAll resets everything', () => {
    const config = { maxRequests: 1, windowMs: 60000 };
    checkRateLimit('a', config);
    checkRateLimit('b', config);
    clearAllRateLimits();
    expect(checkRateLimit('a', config).allowed).toBe(true);
    expect(checkRateLimit('b', config).allowed).toBe(true);
  });

  it('uses default config when none provided', () => {
    const result = checkRateLimit('default');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(DEFAULT_RATE_LIMIT.maxRequests - 1);
  });

  it('handles high-volume requests', () => {
    const config = { maxRequests: 50, windowMs: 60000 };
    for (let i = 0; i < 50; i++) {
      checkRateLimit('volume', config);
    }
    expect(checkRateLimit('volume', config).allowed).toBe(false);
  });
});

describe('CSRF Token', () => {
  beforeEach(() => sessionStorage.clear());

  it('generates 64-char hex token', () => {
    const token = generateCSRFToken();
    expect(token).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(token)).toBe(true);
  });

  it('generates unique tokens', () => {
    const tokens = new Set(Array.from({ length: 20 }, () => generateCSRFToken()));
    expect(tokens.size).toBe(20);
  });

  it('getOrCreate creates when missing', () => {
    const token = getOrCreateCSRFToken();
    expect(token).toHaveLength(64);
  });

  it('getOrCreate returns same token on subsequent calls', () => {
    const first = getOrCreateCSRFToken();
    const second = getOrCreateCSRFToken();
    expect(first).toBe(second);
  });

  it('validates correct token', () => {
    const token = getOrCreateCSRFToken();
    expect(validateCSRFToken(token)).toBe(true);
  });

  it('rejects incorrect token', () => {
    getOrCreateCSRFToken();
    expect(validateCSRFToken('wrong-token')).toBe(false);
  });

  it('rejects empty token', () => {
    expect(validateCSRFToken('')).toBe(false);
  });

  it('rotateCSRFToken generates new token', () => {
    const original = getOrCreateCSRFToken();
    const rotated = rotateCSRFToken();
    expect(rotated).not.toBe(original);
    expect(validateCSRFToken(rotated)).toBe(true);
    expect(validateCSRFToken(original)).toBe(false);
  });
});

describe('API Key Rotation', () => {
  const createFreshKey = (daysOffset = 0): ApiKeyConfig => {
    const created = new Date();
    created.setDate(created.getDate() - daysOffset);
    const expires = new Date(created);
    expires.setDate(expires.getDate() + DEFAULT_ROTATION_INTERVAL_DAYS);
    return { keyId: 'test', createdAt: created, expiresAt: expires, isActive: true };
  };

  it('detects non-expired key', () => {
    expect(isKeyExpired(createFreshKey())).toBe(false);
  });

  it('detects expired key', () => {
    expect(isKeyExpired(createFreshKey(DEFAULT_ROTATION_INTERVAL_DAYS + 1))).toBe(true);
  });

  it('shouldRotateKey returns false for fresh key', () => {
    expect(shouldRotateKey(createFreshKey())).toBe(false);
  });

  it('shouldRotateKey returns true when within warning period', () => {
    expect(shouldRotateKey(createFreshKey(DEFAULT_ROTATION_INTERVAL_DAYS - 3), 7)).toBe(true);
  });

  it('generateRotationSchedule returns valid dates', () => {
    const schedule = generateRotationSchedule(createFreshKey());
    expect(schedule.nextRotation instanceof Date).toBe(true);
    expect(schedule.daysRemaining).toBeGreaterThanOrEqual(0);
  });

  it('createKeyConfig produces valid config', () => {
    const config = createKeyConfig('new-key');
    expect(config.keyId).toBe('new-key');
    expect(config.isActive).toBe(true);
    expect(config.expiresAt > config.createdAt).toBe(true);
  });

  it('createKeyConfig respects custom rotation days', () => {
    const config = createKeyConfig('test', 30);
    const daysDiff = Math.round((config.expiresAt.getTime() - config.createdAt.getTime()) / (1000*60*60*24));
    expect(daysDiff).toBe(30);
  });
});

describe('Secrets Scanner', () => {
  it('detects AWS access keys', () => {
    const result = scanForSecrets('key: AKIAIOSFODNN7EXAMPLE');
    expect(result.found).toBe(true);
    expect(result.matches.some(m => m.name === 'AWS Access Key')).toBe(true);
  });

  it('detects GitHub tokens', () => {
    const result = scanForSecrets('token: ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij');
    expect(result.found).toBe(true);
  });

  it('detects Slack tokens', () => {
    const result = scanForSecrets('xoxb-123456-abcdef-ghijkl');
    expect(result.found).toBe(true);
  });

  it('detects private keys', () => {
    const result = scanForSecrets('-----BEGIN RSA PRIVATE KEY-----');
    expect(result.found).toBe(true);
  });

  it('does not flag normal text', () => {
    const result = scanForSecrets('This is just a normal text about coding');
    expect(result.found).toBe(false);
  });

  it('maskSecret hides middle of secret', () => {
    expect(maskSecret('abcdefghijklmnop')).toBe('abcd****mnop');
  });

  it('maskSecret handles short secrets', () => {
    expect(maskSecret('abc')).toBe('****');
  });

  it('counts multiple occurrences', () => {
    const text = 'AKIAIOSFODNN7EXAMPLE and AKIAIOSFODNN7EXAMPLE';
    const result = scanForSecrets(text);
    const awsMatch = result.matches.find(m => m.name === 'AWS Access Key');
    expect(awsMatch?.count).toBe(2);
  });
});

describe('Security Headers Validator', () => {
  it('calculates score correctly', () => {
    const results: HeaderValidationResult[] = [
      { header: 'X-Frame-Options', present: true, value: 'DENY', recommendation: '' },
      { header: 'CSP', present: false, value: null, recommendation: '' },
      { header: 'HSTS', present: true, value: 'max-age=31536000', recommendation: '' },
      { header: 'X-Content-Type', present: false, value: null, recommendation: '' },
    ];
    expect(getSecurityScore(results)).toBe(50);
  });

  it('returns 100 for all present', () => {
    const results: HeaderValidationResult[] = [
      { header: 'A', present: true, value: 'x', recommendation: '' },
      { header: 'B', present: true, value: 'y', recommendation: '' },
    ];
    expect(getSecurityScore(results)).toBe(100);
  });

  it('returns 0 for none present', () => {
    const results: HeaderValidationResult[] = [
      { header: 'A', present: false, value: null, recommendation: '' },
    ];
    expect(getSecurityScore(results)).toBe(0);
  });
});
