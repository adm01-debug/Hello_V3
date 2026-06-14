import { describe, it, expect } from 'vitest';
import {
  generateEncryptionKey,
  encryptData,
  decryptData,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  hashData,
} from '../encryption';

// Use real WebCrypto via Node's globalThis.crypto (jsdom env exposes a subtle mock in setup,
// but Node 18+ provides webcrypto). Re-bind to ensure round-trip works deterministically.
import { webcrypto } from 'node:crypto';

describe('encryption (coverage)', () => {
  const realCrypto = webcrypto as unknown as Crypto;
  const original = globalThis.crypto;

  it('round-trips encrypt/decrypt with a generated key', async () => {
    Object.defineProperty(globalThis, 'crypto', { value: realCrypto, configurable: true });
    try {
      const key = await generateEncryptionKey();
      expect(key).toBeTruthy();
      const { ciphertext, iv } = await encryptData('hello world', key);
      expect(ciphertext.byteLength).toBeGreaterThan(0);
      expect(iv.byteLength).toBe(12);
      const plain = await decryptData(ciphertext, key, iv);
      expect(plain).toBe('hello world');
    } finally {
      Object.defineProperty(globalThis, 'crypto', { value: original, configurable: true });
    }
  });

  it('hashData returns base64 string with real crypto', async () => {
    Object.defineProperty(globalThis, 'crypto', { value: realCrypto, configurable: true });
    try {
      const hash = await hashData('abc');
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    } finally {
      Object.defineProperty(globalThis, 'crypto', { value: original, configurable: true });
    }
  });

  it('arrayBufferToBase64 and base64ToArrayBuffer are inverse operations', () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 250, 255, 0]);
    const b64 = arrayBufferToBase64(bytes.buffer);
    expect(typeof b64).toBe('string');
    const back = new Uint8Array(base64ToArrayBuffer(b64));
    expect(Array.from(back)).toEqual(Array.from(bytes));
  });

  it('base64ToArrayBuffer handles empty string', () => {
    const buf = base64ToArrayBuffer('');
    expect(buf.byteLength).toBe(0);
  });
});
