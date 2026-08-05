import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateChallenge,
  bufferToBase64Url,
  base64UrlToBuffer,
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  startRegistration,
  startAuthentication,
} from '../webauthn-utils';

function setNavigatorCredentials(create: unknown, get: unknown) {
  Object.defineProperty(navigator, 'credentials', {
    value: { create, get },
    configurable: true,
    writable: true,
  });
}

describe('webauthn-utils (coverage)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // @ts-expect-error cleanup test-injected global
    delete (window as Record<string, unknown>).PublicKeyCredential;
  });

  describe('base64 helpers', () => {
    it('round-trips a buffer through base64url', () => {
      const original = new Uint8Array([0, 1, 2, 250, 255]);
      const encoded = bufferToBase64Url(original);
      expect(encoded).not.toMatch(/[+/=]/);
      const decoded = new Uint8Array(base64UrlToBuffer(encoded));
      expect(Array.from(decoded)).toEqual(Array.from(original));
    });

    it('accepts a plain ArrayBuffer input', () => {
      const buf = new Uint8Array([65, 66, 67]).buffer;
      expect(bufferToBase64Url(buf)).toBe(bufferToBase64Url(new Uint8Array([65, 66, 67])));
    });

    it('generateChallenge produces a 32-byte url-safe value', () => {
      const challenge = generateChallenge();
      expect(typeof challenge).toBe('string');
      expect(challenge).not.toMatch(/[+/=]/);
      expect(new Uint8Array(base64UrlToBuffer(challenge)).length).toBe(32);
    });
  });

  describe('support detection', () => {
    it('isWebAuthnSupported false when no PublicKeyCredential', () => {
      expect(isWebAuthnSupported()).toBe(false);
    });

    it('isWebAuthnSupported true when PublicKeyCredential is a function', () => {
      (window as unknown as Record<string, unknown>).PublicKeyCredential =function () {} as unknown;
      expect(isWebAuthnSupported()).toBe(true);
    });

    it('isPlatformAuthenticatorAvailable returns false when unsupported', async () => {
      await expect(isPlatformAuthenticatorAvailable()).resolves.toBe(false);
    });

    it('isPlatformAuthenticatorAvailable returns true when API resolves true', async () => {
      const fn = function () {} as unknown as Record<string, unknown>;
      fn.isUserVerifyingPlatformAuthenticatorAvailable = vi.fn().mockResolvedValue(true);
      (window as unknown as Record<string, unknown>).PublicKeyCredential =fn;
      await expect(isPlatformAuthenticatorAvailable()).resolves.toBe(true);
    });

    it('isPlatformAuthenticatorAvailable returns false when API throws', async () => {
      const fn = function () {} as unknown as Record<string, unknown>;
      fn.isUserVerifyingPlatformAuthenticatorAvailable = vi.fn().mockRejectedValue(new Error('no'));
      (window as unknown as Record<string, unknown>).PublicKeyCredential =fn;
      await expect(isPlatformAuthenticatorAvailable()).resolves.toBe(false);
    });
  });

  describe('startRegistration', () => {
    it('returns mapped credential fields on success (with optional getters)', async () => {
      const rawId = new Uint8Array([1, 2, 3]).buffer;
      const credential = {
        rawId,
        response: {
          getPublicKey: () => new Uint8Array([4, 5]).buffer,
          getTransports: () => ['internal'],
          clientDataJSON: new Uint8Array([6]).buffer,
          attestationObject: new Uint8Array([7]).buffer,
        },
      };
      setNavigatorCredentials(vi.fn().mockResolvedValue(credential), vi.fn());
      const result = await startRegistration({
        challenge: bufferToBase64Url(new Uint8Array([9])),
        userId: 'user-1',
        userName: 'u',
        userDisplayName: 'U',
        rpName: 'rp',
        rpId: 'example.com',
        excludeCredentialIds: [bufferToBase64Url(new Uint8Array([8]))],
      });
      expect(result.credentialId).toBe(bufferToBase64Url(new Uint8Array([1, 2, 3])));
      expect(result.transports).toEqual(['internal']);
      expect(result.publicKey).toBeTypeOf('string');
    });

    it('handles missing optional getters', async () => {
      const credential = {
        rawId: new Uint8Array([1]).buffer,
        response: {
          clientDataJSON: new Uint8Array([2]).buffer,
          attestationObject: new Uint8Array([3]).buffer,
        },
      };
      setNavigatorCredentials(vi.fn().mockResolvedValue(credential), vi.fn());
      const result = await startRegistration({
        challenge: bufferToBase64Url(new Uint8Array([1])),
        userId: 'u',
        userName: 'u',
        userDisplayName: 'U',
        rpName: 'rp',
        rpId: 'example.com',
      });
      expect(result.transports).toEqual([]);
    });

    it('throws when credential creation returns null', async () => {
      setNavigatorCredentials(vi.fn().mockResolvedValue(null), vi.fn());
      await expect(
        startRegistration({
          challenge: bufferToBase64Url(new Uint8Array([1])),
          userId: 'u',
          userName: 'u',
          userDisplayName: 'U',
          rpName: 'rp',
          rpId: 'example.com',
        }),
      ).rejects.toThrow('Failed to create credential');
    });
  });

  describe('startAuthentication', () => {
    it('returns mapped fields with userHandle present', async () => {
      const credential = {
        rawId: new Uint8Array([1, 2]).buffer,
        response: {
          clientDataJSON: new Uint8Array([3]).buffer,
          authenticatorData: new Uint8Array([4]).buffer,
          signature: new Uint8Array([5]).buffer,
          userHandle: new Uint8Array([6]).buffer,
        },
      };
      setNavigatorCredentials(vi.fn(), vi.fn().mockResolvedValue(credential));
      const result = await startAuthentication({
        challenge: bufferToBase64Url(new Uint8Array([1])),
        rpId: 'example.com',
        allowCredentialIds: [bufferToBase64Url(new Uint8Array([7]))],
      });
      expect(result.credentialId).toBe(bufferToBase64Url(new Uint8Array([1, 2])));
      expect(result.userHandle).toBeTypeOf('string');
    });

    it('returns undefined userHandle when absent', async () => {
      const credential = {
        rawId: new Uint8Array([1]).buffer,
        response: {
          clientDataJSON: new Uint8Array([2]).buffer,
          authenticatorData: new Uint8Array([3]).buffer,
          signature: new Uint8Array([4]).buffer,
          userHandle: null,
        },
      };
      setNavigatorCredentials(vi.fn(), vi.fn().mockResolvedValue(credential));
      const result = await startAuthentication({
        challenge: bufferToBase64Url(new Uint8Array([1])),
        rpId: 'example.com',
      });
      expect(result.userHandle).toBeUndefined();
    });

    it('throws when get returns null', async () => {
      setNavigatorCredentials(vi.fn(), vi.fn().mockResolvedValue(null));
      await expect(
        startAuthentication({ challenge: bufferToBase64Url(new Uint8Array([1])), rpId: 'example.com' }),
      ).rejects.toThrow('Failed to get credential');
    });
  });
});
