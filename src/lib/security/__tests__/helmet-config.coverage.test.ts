import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DEFAULT_SECURITY_HEADERS,
  getSecurityHeaders,
  applyMetaTags,
} from '../helmet-config';

describe('helmet-config (coverage)', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
  });

  it('DEFAULT_SECURITY_HEADERS has expected secure defaults', () => {
    expect(DEFAULT_SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff');
    expect(DEFAULT_SECURITY_HEADERS['X-Frame-Options']).toBe('DENY');
    expect(DEFAULT_SECURITY_HEADERS['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });

  it('getSecurityHeaders returns defaults when no overrides', () => {
    expect(getSecurityHeaders()).toEqual(DEFAULT_SECURITY_HEADERS);
  });

  it('getSecurityHeaders merges overrides', () => {
    const result = getSecurityHeaders({ 'X-Frame-Options': 'SAMEORIGIN' });
    expect(result['X-Frame-Options']).toBe('SAMEORIGIN');
    expect(result['X-Content-Type-Options']).toBe('nosniff');
  });

  it('applyMetaTags appends meta tags to document head', () => {
    applyMetaTags();
    const metas = document.querySelectorAll('meta[http-equiv]');
    expect(metas.length).toBe(Object.keys(DEFAULT_SECURITY_HEADERS).length);
    const xcto = document.querySelector('meta[http-equiv="X-Content-Type-Options"]');
    expect(xcto?.getAttribute('content')).toBe('nosniff');
  });

  it('applyMetaTags does not duplicate existing meta tags', () => {
    const existing = document.createElement('meta');
    existing.httpEquiv = 'X-Frame-Options';
    existing.content = 'SAMEORIGIN';
    document.head.appendChild(existing);

    applyMetaTags();

    const frameMetas = document.querySelectorAll('meta[http-equiv="X-Frame-Options"]');
    expect(frameMetas.length).toBe(1);
    expect(frameMetas[0].getAttribute('content')).toBe('SAMEORIGIN');
  });

  it('applyMetaTags applies override values', () => {
    applyMetaTags({ 'X-Frame-Options': 'SAMEORIGIN' });
    const frame = document.querySelector('meta[http-equiv="X-Frame-Options"]');
    expect(frame?.getAttribute('content')).toBe('SAMEORIGIN');
  });
});
