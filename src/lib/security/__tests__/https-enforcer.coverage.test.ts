import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { shouldEnforceHTTPS, enforceHTTPS, getProtocolInfo } from '../https-enforcer';

const originalLocation = window.location;

function setLocation(props: Partial<Location>) {
  Object.defineProperty(window, 'location', {
    writable: true,
    configurable: true,
    value: { ...originalLocation, replace: vi.fn(), ...props },
  });
}

describe('https-enforcer', () => {
  afterEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: originalLocation,
    });
  });

  it('does not enforce on localhost', () => {
    setLocation({ hostname: 'localhost', protocol: 'http:' });
    expect(shouldEnforceHTTPS()).toBe(false);
  });

  it('does not enforce on 127.0.0.1', () => {
    setLocation({ hostname: '127.0.0.1', protocol: 'http:' });
    expect(shouldEnforceHTTPS()).toBe(false);
  });

  it('does not enforce when already https', () => {
    setLocation({ hostname: 'example.com', protocol: 'https:' });
    expect(shouldEnforceHTTPS()).toBe(false);
  });

  it('enforces on http non-localhost', () => {
    setLocation({ hostname: 'example.com', protocol: 'http:' });
    expect(shouldEnforceHTTPS()).toBe(true);
  });

  it('enforceHTTPS redirects when needed', () => {
    setLocation({
      hostname: 'example.com',
      protocol: 'http:',
      href: 'http://example.com/page',
    });
    enforceHTTPS();
    expect(window.location.replace).toHaveBeenCalledWith('https://example.com/page');
  });

  it('enforceHTTPS does nothing when secure', () => {
    setLocation({ hostname: 'example.com', protocol: 'https:', href: 'https://example.com' });
    enforceHTTPS();
    expect(window.location.replace).not.toHaveBeenCalled();
  });

  it('getProtocolInfo returns details (secure)', () => {
    setLocation({ hostname: 'example.com', protocol: 'https:' });
    expect(getProtocolInfo()).toEqual({
      isSecure: true,
      protocol: 'https:',
      hostname: 'example.com',
    });
  });

  it('getProtocolInfo returns details (insecure)', () => {
    setLocation({ hostname: 'example.com', protocol: 'http:' });
    expect(getProtocolInfo().isSecure).toBe(false);
  });
});
