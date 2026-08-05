import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildCSPHeader, DEFAULT_CSP_DIRECTIVES } from '@/lib/security/content-security-policy';
import { buildCORSHeaders } from '@/lib/security/cors-config';
import { getSecurityHeaders, DEFAULT_SECURITY_HEADERS } from '@/lib/security/helmet-config';
import { buildHSTSHeader, DEFAULT_HSTS_CONFIG } from '@/lib/security/hsts-headers';
import { shouldEnforceHTTPS, getProtocolInfo } from '@/lib/security/https-enforcer';
import { decodeJWTPayload, isTokenExpired, getTokenExpirationDate, getTimeUntilExpiration } from '@/lib/security/jwt-handler';
import { createFinding, generateReport, getSeverityScore } from '@/lib/security/penetration-test-reporter';
import type { Severity } from '@/lib/security/penetration-test-reporter';

// ===================== CSP =====================
describe('Content Security Policy', () => {
  it('builds a valid CSP header with default directives', () => {
    const header = buildCSPHeader();
    expect(header).toContain("default-src 'self'");
    expect(header).toContain("object-src 'none'");
    expect(header).toContain("frame-src 'none'");
  });

  it('includes all default directive keys', () => {
    const header = buildCSPHeader();
    const expectedKeys = ['default-src', 'script-src', 'style-src', 'img-src', 'connect-src', 'font-src', 'object-src', 'media-src', 'frame-src', 'worker-src', 'form-action', 'base-uri'];
    expectedKeys.forEach(key => expect(header).toContain(key));
  });

  it('merges custom directives', () => {
    const header = buildCSPHeader({ frameSrc: ['https://youtube.com'] });
    expect(header).toContain('frame-src https://youtube.com');
  });

  it('separates directives with semicolons', () => {
    const header = buildCSPHeader();
    expect(header.split(';').length).toBeGreaterThan(5);
  });

  it('default CSP has supabase in connect-src', () => {
    expect(DEFAULT_CSP_DIRECTIVES.connectSrc).toContain("https://*.supabase.co");
  });

  it('default CSP blocks frames', () => {
    expect(DEFAULT_CSP_DIRECTIVES.frameSrc).toContain("'none'");
  });

  it('default CSP blocks objects', () => {
    expect(DEFAULT_CSP_DIRECTIVES.objectSrc).toContain("'none'");
  });
});

// ===================== CORS =====================
describe('CORS Configuration', () => {
  it('builds headers with all required fields', () => {
    const headers = buildCORSHeaders({
      allowedOrigins: ['https://example.com'],
      allowedMethods: ['GET', 'POST'],
      allowedHeaders: ['content-type'],
      exposeHeaders: [],
      maxAge: 3600,
      credentials: true,
    });
    expect(headers['Access-Control-Allow-Origin']).toBe('https://example.com');
    expect(headers['Access-Control-Allow-Methods']).toBe('GET, POST');
    expect(headers['Access-Control-Allow-Credentials']).toBe('true');
  });

  it('omits credentials header when false', () => {
    const headers = buildCORSHeaders({
      allowedOrigins: ['*'],
      allowedMethods: ['GET'],
      allowedHeaders: [],
      exposeHeaders: [],
      maxAge: 0,
      credentials: false,
    });
    expect(headers['Access-Control-Allow-Credentials']).toBeUndefined();
  });

  it('includes max-age as string', () => {
    const headers = buildCORSHeaders({
      allowedOrigins: ['*'],
      allowedMethods: ['GET'],
      allowedHeaders: [],
      exposeHeaders: [],
      maxAge: 86400,
      credentials: false,
    });
    expect(headers['Access-Control-Max-Age']).toBe('86400');
  });
});

// ===================== Helmet =====================
describe('Security Headers (Helmet)', () => {
  it('provides default headers', () => {
    const headers = getSecurityHeaders();
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['X-XSS-Protection']).toBe('0');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });

  it('allows overrides', () => {
    const headers = getSecurityHeaders({ 'X-Frame-Options': 'SAMEORIGIN' });
    expect(headers['X-Frame-Options']).toBe('SAMEORIGIN');
  });

  it('preserves non-overridden headers', () => {
    const headers = getSecurityHeaders({ 'X-Frame-Options': 'SAMEORIGIN' });
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
  });

  it('includes all 8 default headers', () => {
    expect(Object.keys(DEFAULT_SECURITY_HEADERS)).toHaveLength(8);
  });

  it('Permissions-Policy restricts camera', () => {
    expect(DEFAULT_SECURITY_HEADERS['Permissions-Policy']).toContain('camera=()');
  });
});

// ===================== HSTS =====================
describe('HSTS Configuration', () => {
  it('builds default header', () => {
    const header = buildHSTSHeader();
    expect(header).toContain('max-age=31536000');
    expect(header).toContain('includeSubDomains');
    expect(header).toContain('preload');
  });

  it('respects custom max-age', () => {
    const header = buildHSTSHeader({ maxAge: 3600, includeSubDomains: false, preload: false });
    expect(header).toBe('max-age=3600');
  });

  it('includes subdomains when enabled', () => {
    const header = buildHSTSHeader({ maxAge: 100, includeSubDomains: true, preload: false });
    expect(header).toBe('max-age=100; includeSubDomains');
  });

  it('default config has 1 year max-age', () => {
    expect(DEFAULT_HSTS_CONFIG.maxAge).toBe(31536000);
  });
});

// ===================== HTTPS Enforcer =====================
describe('HTTPS Enforcer', () => {
  it('shouldEnforceHTTPS returns false for localhost', () => {
    // jsdom defaults to localhost
    expect(shouldEnforceHTTPS()).toBe(false);
  });

  it('getProtocolInfo returns protocol details', () => {
    const info = getProtocolInfo();
    expect(info).toHaveProperty('isSecure');
    expect(info).toHaveProperty('protocol');
    expect(info).toHaveProperty('hostname');
  });

  it('getProtocolInfo hostname is string', () => {
    expect(typeof getProtocolInfo().hostname).toBe('string');
  });
});

// ===================== JWT Handler =====================
describe('JWT Handler', () => {
  // Create a valid JWT for testing (header.payload.signature)
  const createTestJWT = (payload: Record<string, unknown>) => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    return `${header}.${body}.fakesignature`;
  };

  it('decodes valid JWT payload', () => {
    const token = createTestJWT({ sub: 'user-123', email: 'test@example.com' });
    const payload = decodeJWTPayload(token);
    expect(payload?.sub).toBe('user-123');
    expect(payload?.email).toBe('test@example.com');
  });

  it('returns null for invalid JWT', () => {
    expect(decodeJWTPayload('not-a-jwt')).toBeNull();
    expect(decodeJWTPayload('')).toBeNull();
    expect(decodeJWTPayload('a.b')).toBeNull();
  });

  it('returns null for malformed payload', () => {
    expect(decodeJWTPayload('a.!!!.c')).toBeNull();
  });

  it('detects expired token', () => {
    const token = createTestJWT({ exp: Math.floor(Date.now() / 1000) - 3600 });
    expect(isTokenExpired(token)).toBe(true);
  });

  it('detects non-expired token', () => {
    const token = createTestJWT({ exp: Math.floor(Date.now() / 1000) + 3600 });
    expect(isTokenExpired(token)).toBe(false);
  });

  it('treats token without exp as expired', () => {
    const token = createTestJWT({ sub: 'user' });
    expect(isTokenExpired(token)).toBe(true);
  });

  it('getTokenExpirationDate returns correct date', () => {
    const futureTs = Math.floor(Date.now() / 1000) + 7200;
    const token = createTestJWT({ exp: futureTs });
    const date = getTokenExpirationDate(token);
    expect(date).toBeInstanceOf(Date);
    expect(date!.getTime()).toBe(futureTs * 1000);
  });

  it('getTokenExpirationDate returns null without exp', () => {
    expect(getTokenExpirationDate(createTestJWT({}))).toBeNull();
  });

  it('getTimeUntilExpiration returns positive for future token', () => {
    const token = createTestJWT({ exp: Math.floor(Date.now() / 1000) + 3600 });
    expect(getTimeUntilExpiration(token)).toBeGreaterThan(0);
  });

  it('getTimeUntilExpiration returns 0 for expired token', () => {
    const token = createTestJWT({ exp: Math.floor(Date.now() / 1000) - 100 });
    expect(getTimeUntilExpiration(token)).toBe(0);
  });

  it('getTimeUntilExpiration returns 0 without exp', () => {
    expect(getTimeUntilExpiration(createTestJWT({}))).toBe(0);
  });

  it('handles base64url encoded JWTs', () => {
    // JWT with base64url chars (- and _)
    const header = btoa(JSON.stringify({ alg: 'HS256' })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const body = btoa(JSON.stringify({ sub: 'test' })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const token = `${header}.${body}.sig`;
    const payload = decodeJWTPayload(token);
    expect(payload?.sub).toBe('test');
  });
});

// ===================== Pentest Reporter =====================
describe('Penetration Test Reporter', () => {
  it('creates finding with auto-generated id and date', () => {
    const finding = createFinding({
      title: 'XSS Vulnerability',
      severity: 'high',
      category: 'injection',
      description: 'Reflected XSS found',
      recommendation: 'Sanitize inputs',
    });
    expect(finding.id).toBeTruthy();
    expect(finding.foundAt).toBeInstanceOf(Date);
    expect(finding.status).toBe('open');
  });

  it('generates report with correct summary counts', () => {
    const findings = [
      createFinding({ title: 'A', severity: 'critical', category: 'c', description: 'd', recommendation: 'r' }),
      createFinding({ title: 'B', severity: 'critical', category: 'c', description: 'd', recommendation: 'r' }),
      createFinding({ title: 'C', severity: 'high', category: 'c', description: 'd', recommendation: 'r' }),
      createFinding({ title: 'D', severity: 'medium', category: 'c', description: 'd', recommendation: 'r' }),
      createFinding({ title: 'E', severity: 'low', category: 'c', description: 'd', recommendation: 'r' }),
      createFinding({ title: 'F', severity: 'info', category: 'c', description: 'd', recommendation: 'r' }),
    ];
    const report = generateReport('Full scan', findings);
    expect(report.summary.total).toBe(6);
    expect(report.summary.critical).toBe(2);
    expect(report.summary.high).toBe(1);
    expect(report.summary.medium).toBe(1);
    expect(report.summary.low).toBe(1);
    expect(report.summary.info).toBe(1);
  });

  it('generates report with empty findings', () => {
    const report = generateReport('Empty', []);
    expect(report.summary.total).toBe(0);
    expect(report.findings).toHaveLength(0);
  });

  it('report has unique id', () => {
    const r1 = generateReport('A', []);
    const r2 = generateReport('B', []);
    expect(r1.reportId).not.toBe(r2.reportId);
  });

  it('getSeverityScore returns correct values', () => {
    const scores: [Severity, number][] = [
      ['critical', 10], ['high', 8], ['medium', 5], ['low', 2], ['info', 0],
    ];
    scores.forEach(([severity, expected]) => {
      expect(getSeverityScore(severity)).toBe(expected);
    });
  });

  it('report scope is preserved', () => {
    const report = generateReport('API endpoints', []);
    expect(report.scope).toBe('API endpoints');
  });
});
