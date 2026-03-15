import { describe, it, expect, vi } from 'vitest';
import { arrayBufferToBase64, base64ToArrayBuffer } from '@/lib/security/encryption';
import { bufferToBase64Url, base64UrlToBuffer, generateChallenge, isWebAuthnSupported } from '@/lib/webauthn/webauthn-utils';

describe('Encryption Utilities', () => {
  describe('arrayBufferToBase64', () => {
    it('converts empty buffer', () => {
      expect(arrayBufferToBase64(new ArrayBuffer(0))).toBe('');
    });

    it('converts known bytes', () => {
      const arr = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const b64 = arrayBufferToBase64(arr.buffer);
      expect(b64).toBe(btoa('Hello'));
    });

    it('roundtrips correctly', () => {
      const original = new Uint8Array([0, 1, 127, 128, 255]);
      const b64 = arrayBufferToBase64(original.buffer);
      const restored = new Uint8Array(base64ToArrayBuffer(b64));
      expect(Array.from(restored)).toEqual(Array.from(original));
    });

    it('handles single byte', () => {
      const arr = new Uint8Array([42]);
      const b64 = arrayBufferToBase64(arr.buffer);
      const restored = new Uint8Array(base64ToArrayBuffer(b64));
      expect(restored[0]).toBe(42);
    });

    it('handles 256 bytes', () => {
      const arr = new Uint8Array(256);
      for (let i = 0; i < 256; i++) arr[i] = i;
      const b64 = arrayBufferToBase64(arr.buffer);
      const restored = new Uint8Array(base64ToArrayBuffer(b64));
      expect(restored.length).toBe(256);
      expect(restored[0]).toBe(0);
      expect(restored[255]).toBe(255);
    });
  });

  describe('base64ToArrayBuffer', () => {
    it('converts empty string', () => {
      const buf = base64ToArrayBuffer(btoa(''));
      expect(buf.byteLength).toBe(0);
    });

    it('converts known base64', () => {
      const buf = base64ToArrayBuffer(btoa('Test'));
      const str = new TextDecoder().decode(buf);
      expect(str).toBe('Test');
    });

    it('handles binary data', () => {
      const bytes = new Uint8Array([0, 128, 255]);
      const b64 = btoa(String.fromCharCode(...bytes));
      const restored = new Uint8Array(base64ToArrayBuffer(b64));
      expect(Array.from(restored)).toEqual([0, 128, 255]);
    });
  });
});

describe('WebAuthn Utilities', () => {
  describe('bufferToBase64Url', () => {
    it('converts to URL-safe base64', () => {
      const data = new Uint8Array([255, 239, 191]); // produces +/= in standard base64
      const result = bufferToBase64Url(data);
      expect(result).not.toContain('+');
      expect(result).not.toContain('/');
      expect(result).not.toContain('=');
    });

    it('handles empty buffer', () => {
      expect(bufferToBase64Url(new Uint8Array(0))).toBe('');
    });

    it('handles Uint8Array directly', () => {
      const arr = new Uint8Array([1, 2, 3]);
      const result = bufferToBase64Url(arr);
      expect(result.length).toBeGreaterThan(0);
    });

    it('handles ArrayBuffer', () => {
      const buf = new Uint8Array([4, 5, 6]).buffer;
      const result = bufferToBase64Url(buf);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('base64UrlToBuffer', () => {
    it('roundtrips with bufferToBase64Url', () => {
      const original = new Uint8Array([0, 1, 127, 128, 255, 10, 20, 30]);
      const encoded = bufferToBase64Url(original);
      const decoded = new Uint8Array(base64UrlToBuffer(encoded));
      expect(Array.from(decoded)).toEqual(Array.from(original));
    });

    it('handles strings needing padding', () => {
      // 1 byte = needs 2 padding chars
      const original = new Uint8Array([42]);
      const encoded = bufferToBase64Url(original);
      const decoded = new Uint8Array(base64UrlToBuffer(encoded));
      expect(decoded[0]).toBe(42);
    });

    it('handles strings needing single padding', () => {
      // 2 bytes = needs 1 padding char
      const original = new Uint8Array([42, 43]);
      const encoded = bufferToBase64Url(original);
      const decoded = new Uint8Array(base64UrlToBuffer(encoded));
      expect(Array.from(decoded)).toEqual([42, 43]);
    });

    it('handles no padding needed', () => {
      // 3 bytes = no padding
      const original = new Uint8Array([1, 2, 3]);
      const encoded = bufferToBase64Url(original);
      const decoded = new Uint8Array(base64UrlToBuffer(encoded));
      expect(Array.from(decoded)).toEqual([1, 2, 3]);
    });
  });

  describe('generateChallenge', () => {
    it('returns non-empty string', () => {
      const challenge = generateChallenge();
      expect(challenge.length).toBeGreaterThan(0);
    });

    it('generates unique challenges', () => {
      const challenges = new Set(Array.from({ length: 50 }, () => generateChallenge()));
      expect(challenges.size).toBe(50);
    });

    it('returns URL-safe base64', () => {
      const challenge = generateChallenge();
      expect(challenge).not.toContain('+');
      expect(challenge).not.toContain('/');
      expect(challenge).not.toContain('=');
    });

    it('decodes to 32 bytes', () => {
      const challenge = generateChallenge();
      const buf = base64UrlToBuffer(challenge);
      expect(buf.byteLength).toBe(32);
    });
  });

  describe('isWebAuthnSupported', () => {
    it('returns boolean', () => {
      expect(typeof isWebAuthnSupported()).toBe('boolean');
    });
  });
});
