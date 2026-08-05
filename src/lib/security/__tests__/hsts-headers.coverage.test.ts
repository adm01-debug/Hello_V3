import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  buildHSTSHeader,
  isSecureConnection,
  enforceHTTPS,
  DEFAULT_HSTS_CONFIG,
} from '../hsts-headers';

interface MockLocation {
  protocol: string;
  hostname: string;
  pathname: string;
  search: string;
  replace: ReturnType<typeof vi.fn>;
}

const originalLocation = window.location;

function setLocation(loc: Partial<MockLocation>): MockLocation {
  const value: MockLocation = {
    protocol: 'https:',
    hostname: 'example.com',
    pathname: '/',
    search: '',
    replace: vi.fn(),
    ...loc,
  };
  Object.defineProperty(window, 'location', {
    value,
    writable: true,
    configurable: true,
  });
  return value;
}

afterEach(() => {
  Object.defineProperty(window, 'location', {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
});

describe('buildHSTSHeader', () => {
  it('builds header from default config', () => {
    const header = buildHSTSHeader();
    expect(header).toBe(
      `max-age=${DEFAULT_HSTS_CONFIG.maxAge}; includeSubDomains; preload`,
    );
  });

  it('omits includeSubDomains and preload when false', () => {
    const header = buildHSTSHeader({
      maxAge: 100,
      includeSubDomains: false,
      preload: false,
    });
    expect(header).toBe('max-age=100');
  });

  it('includes only includeSubDomains when preload is false', () => {
    const header = buildHSTSHeader({
      maxAge: 200,
      includeSubDomains: true,
      preload: false,
    });
    expect(header).toBe('max-age=200; includeSubDomains');
  });

  it('includes only preload when includeSubDomains is false', () => {
    const header = buildHSTSHeader({
      maxAge: 300,
      includeSubDomains: false,
      preload: true,
    });
    expect(header).toBe('max-age=300; preload');
  });
});

describe('isSecureConnection', () => {
  it('returns true for https', () => {
    setLocation({ protocol: 'https:' });
    expect(isSecureConnection()).toBe(true);
  });

  it('returns false for http', () => {
    setLocation({ protocol: 'http:' });
    expect(isSecureConnection()).toBe(false);
  });
});

describe('enforceHTTPS', () => {
  it('does nothing on https', () => {
    const loc = setLocation({ protocol: 'https:', hostname: 'example.com' });
    enforceHTTPS();
    expect(loc.replace).not.toHaveBeenCalled();
  });

  it('does nothing on localhost', () => {
    const loc = setLocation({ protocol: 'http:', hostname: 'localhost' });
    enforceHTTPS();
    expect(loc.replace).not.toHaveBeenCalled();
  });

  it('redirects to https on non-secure, non-localhost host', () => {
    const loc = setLocation({
      protocol: 'http:',
      hostname: 'example.com',
      pathname: '/page',
      search: '?a=1',
    });
    enforceHTTPS();
    expect(loc.replace).toHaveBeenCalledWith('https://example.com/page?a=1');
  });
});
