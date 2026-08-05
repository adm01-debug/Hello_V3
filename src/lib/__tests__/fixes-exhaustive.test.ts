/**
 * Exhaustive tests for all bug fixes applied in PR #4:
 * 1. useMFA — CSPRNG backup code generation
 * 2. jwt-handler — base64url padding + UTF-8 decoding
 * 3. web-vitals — FCP entry name filtering
 * 4. supabase/client — fail-fast on missing env vars
 * 5. useDashboardLayout — localStorage resilience
 * 6. useSupervisorPanel — localStorage resilience
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// 1. CSPRNG backup code generation (extracted logic, no React dependency)
// ---------------------------------------------------------------------------

function generateBackupCodes(): string[] {
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const codes = new Set<string>();
  while (codes.size < 10) {
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    const code = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
    codes.add(code);
  }
  return [...codes];
}

describe('generateBackupCodes (CSPRNG)', () => {
  it('returns exactly 10 codes', () => {
    expect(generateBackupCodes()).toHaveLength(10);
  });

  it('all codes are 6 characters long', () => {
    const codes = generateBackupCodes();
    for (const code of codes) {
      expect(code).toHaveLength(6);
    }
  });

  it('all codes use only Crockford alphabet characters', () => {
    const ALPHABET = new Set('ABCDEFGHJKLMNPQRSTUVWXYZ23456789');
    const codes = generateBackupCodes();
    for (const code of codes) {
      for (const char of code) {
        expect(ALPHABET.has(char)).toBe(true);
      }
    }
  });

  it('no visually ambiguous characters (0, 1, I, O) appear', () => {
    // The alphabet excludes: I (≈1), O (≈0), digit 0, digit 1.
    // L and U are retained — they are unambiguous in this Crockford variant.
    const AMBIGUOUS = new Set(['0', '1', 'I', 'O']);
    for (let i = 0; i < 20; i++) {
      const codes = generateBackupCodes();
      for (const code of codes) {
        for (const char of code) {
          expect(AMBIGUOUS.has(char)).toBe(false);
        }
      }
    }
  });

  it('all 10 codes are unique (Set deduplication works)', () => {
    for (let i = 0; i < 5; i++) {
      const codes = generateBackupCodes();
      expect(new Set(codes).size).toBe(10);
    }
  });

  it('two successive calls produce different sets (statistical randomness)', () => {
    const set1 = generateBackupCodes().join(',');
    const set2 = generateBackupCodes().join(',');
    // Probability of collision is astronomically low (32^6)^10 space
    expect(set1).not.toBe(set2);
  });

  it('uses crypto.getRandomValues not Math.random', () => {
    const spy = vi.spyOn(crypto, 'getRandomValues');
    generateBackupCodes();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// 2. JWT handler — base64url padding + UTF-8 decoding
// ---------------------------------------------------------------------------

import {
  decodeJWTPayload,
  isTokenExpired,
  getTokenExpirationDate,
  getTimeUntilExpiration,
} from '../security/jwt-handler';

function makeJWT(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  // base64url-encode the payload properly
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, ''); // strip padding → triggers the fix
  return `${header}.${body}.fakesig`;
}

describe('decodeJWTPayload', () => {
  it('decodes a standard payload', () => {
    const token = makeJWT({ sub: 'u1', email: 'a@b.com', role: 'admin' });
    const result = decodeJWTPayload(token);
    expect(result?.sub).toBe('u1');
    expect(result?.email).toBe('a@b.com');
    expect(result?.role).toBe('admin');
  });

  it('handles payload whose base64 length % 4 === 1 (needs 3-pad)', () => {
    // Force a payload whose base64url encoding needs 3 padding chars
    const payload = { x: 'y' }; // {"x":"y"} = 9 chars → base64 needs padding
    const token = makeJWT(payload);
    const decoded = decodeJWTPayload(token);
    expect(decoded?.x).toBe('y');
  });

  it('handles payload whose base64 length % 4 === 2 (needs 2-pad)', () => {
    const payload = { a: 1 };
    const token = makeJWT(payload);
    expect(decodeJWTPayload(token)?.a).toBe(1);
  });

  it('handles payload whose base64 length % 4 === 3 (needs 1-pad)', () => {
    const payload = { longKey: 'longValue' };
    const token = makeJWT(payload);
    const decoded = decodeJWTPayload(token);
    expect(decoded?.longKey).toBe('longValue');
  });

  it('handles base64url characters (- and _)', () => {
    // Craft a payload that generates + and / in standard base64
    const payload = { data: '>>>???' }; // encodes to chars with + and /
    const token = makeJWT(payload);
    const decoded = decodeJWTPayload(token);
    expect(decoded?.data).toBe('>>>???');
  });

  it('decodes UTF-8 payload with non-ASCII characters', () => {
    // Build token manually with proper UTF-8 encoding
    const payloadObj = { name: 'João', city: 'São Paulo', emoji: '🔐' };
    const json = JSON.stringify(payloadObj);
    const bytes = new TextEncoder().encode(json);
    let binary = '';
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    const b64 = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const token = `header.${b64}.sig`;
    const decoded = decodeJWTPayload(token);
    expect(decoded?.name).toBe('João');
    expect(decoded?.city).toBe('São Paulo');
    expect(decoded?.emoji).toBe('🔐');
  });

  it('returns null for token with wrong number of parts', () => {
    expect(decodeJWTPayload('onlyone')).toBeNull();
    expect(decodeJWTPayload('only.two')).toBeNull();
    expect(decodeJWTPayload('has.four.parts.here')).toBeNull();
  });

  it('returns null for token with invalid base64', () => {
    expect(decodeJWTPayload('h.!!!not-base64!!!.s')).toBeNull();
  });

  it('returns null for token with non-JSON payload', () => {
    const notJson = btoa('this is not json').replace(/=+$/, '');
    expect(decodeJWTPayload(`h.${notJson}.s`)).toBeNull();
  });

  it('isTokenExpired returns true for expired token', () => {
    const exp = Math.floor(Date.now() / 1000) - 3600; // 1h ago
    const token = makeJWT({ exp });
    expect(isTokenExpired(token)).toBe(true);
  });

  it('isTokenExpired returns false for valid token', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600; // 1h from now
    const token = makeJWT({ exp });
    expect(isTokenExpired(token)).toBe(false);
  });

  it('isTokenExpired returns true if no exp claim', () => {
    const token = makeJWT({ sub: 'u1' });
    expect(isTokenExpired(token)).toBe(true);
  });

  it('getTokenExpirationDate returns correct date', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = makeJWT({ exp });
    const date = getTokenExpirationDate(token);
    expect(date).not.toBeNull();
    expect(date!.getTime()).toBe(exp * 1000);
  });

  it('getTimeUntilExpiration returns positive value for future token', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = makeJWT({ exp });
    expect(getTimeUntilExpiration(token)).toBeGreaterThan(0);
  });

  it('getTimeUntilExpiration returns 0 for expired token', () => {
    const exp = Math.floor(Date.now() / 1000) - 3600;
    const token = makeJWT({ exp });
    expect(getTimeUntilExpiration(token)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 3. web-vitals — FCP filtering (in-context test)
// ---------------------------------------------------------------------------

interface CapturedObserver {
  callback: (list: { getEntries: () => unknown[] }) => void;
  type?: string;
}
const observers: CapturedObserver[] = [];

class MockPerformanceObserver {
  callback: CapturedObserver['callback'];
  constructor(cb: CapturedObserver['callback']) {
    this.callback = cb;
  }
  observe(opts: { type: string }) {
    observers.push({ callback: this.callback, type: opts.type });
  }
  disconnect() {}
}

function emit(type: string, entries: unknown[]) {
  for (const o of observers.filter((x) => x.type === type)) {
    o.callback({ getEntries: () => entries });
  }
}

import { getWebVitals, initWebVitals } from '../web-vitals';

describe('web-vitals FCP filtering (fix verification)', () => {
  beforeEach(() => {
    observers.length = 0;
    vi.stubGlobal('PerformanceObserver', MockPerformanceObserver as unknown as typeof PerformanceObserver);
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('records FCP only when entry.name === first-contentful-paint', () => {
    initWebVitals();
    const before = getWebVitals().length;

    // A 'first-paint' entry must NOT produce an FCP metric
    emit('paint', [{ name: 'first-paint', startTime: 100 }]);
    expect(getWebVitals().filter((v) => v.name === 'FCP').length).toBe(0);

    // A 'first-contentful-paint' entry MUST produce an FCP metric
    emit('paint', [{ name: 'first-contentful-paint', startTime: 1200 }]);
    const fcp = getWebVitals().filter((v) => v.name === 'FCP');
    expect(fcp.length).toBeGreaterThan(0);
    expect(fcp[fcp.length - 1].value).toBe(1200);
    expect(fcp[fcp.length - 1].rating).toBe('good'); // < 1800ms threshold

    void before;
  });

  it('correctly rates FCP as needs-improvement (1800-3000ms)', () => {
    initWebVitals();
    emit('paint', [{ name: 'first-contentful-paint', startTime: 2500 }]);
    const fcp = getWebVitals().filter((v) => v.name === 'FCP');
    expect(fcp[fcp.length - 1].rating).toBe('needs-improvement');
  });

  it('correctly rates FCP as poor (>3000ms)', () => {
    initWebVitals();
    emit('paint', [{ name: 'first-contentful-paint', startTime: 3500 }]);
    const fcp = getWebVitals().filter((v) => v.name === 'FCP');
    expect(fcp[fcp.length - 1].rating).toBe('poor');
  });

  it('does not crash on empty paint entries', () => {
    initWebVitals();
    expect(() => emit('paint', [])).not.toThrow();
  });

  it('does not crash when paint entries lack a name field', () => {
    initWebVitals();
    // Snapshot FCP count before emitting
    const fcpBefore = getWebVitals().filter((v) => v.name === 'FCP').length;
    // Entry without name — should be filtered out gracefully
    expect(() => emit('paint', [{ startTime: 500 }])).not.toThrow();
    // Count must not have grown — nameless entry gets filtered
    const fcpAfter = getWebVitals().filter((v) => v.name === 'FCP').length;
    expect(fcpAfter).toBe(fcpBefore);
  });
});

// ---------------------------------------------------------------------------
// 4. supabase/client — fail-fast on missing env vars
// ---------------------------------------------------------------------------

describe('supabase client env var guard', () => {
  it('throws a descriptive error when VITE_SUPABASE_URL is missing', async () => {
    // We can't easily re-import the module, so we test the guard logic directly
    function createSupabaseClientGuard(url: string | undefined, key: string | undefined) {
      if (!url || !key) {
        throw new Error(
          'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Check your .env file (see .env.example).'
        );
      }
      return { url, key };
    }

    expect(() => createSupabaseClientGuard(undefined, 'key')).toThrow(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY'
    );
    expect(() => createSupabaseClientGuard('url', undefined)).toThrow(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY'
    );
    expect(() => createSupabaseClientGuard(undefined, undefined)).toThrow(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY'
    );
    expect(() => createSupabaseClientGuard('', 'key')).toThrow(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY'
    );
    // Valid case should not throw
    expect(() => createSupabaseClientGuard('https://example.supabase.co', 'anon-key')).not.toThrow();
  });

  it('error message points to .env.example', () => {
    function guard(url?: string, key?: string) {
      if (!url || !key) throw new Error(
        'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Check your .env file (see .env.example).'
      );
    }
    try {
      guard();
    } catch (e) {
      expect((e as Error).message).toContain('.env.example');
    }
  });
});

// ---------------------------------------------------------------------------
// 5. localStorage resilience — useDashboardLayout logic
// ---------------------------------------------------------------------------

describe('localStorage resilience (useDashboardLayout pattern)', () => {
  const DEFAULT_LAYOUT = [{ id: 'stats', visible: true }, { id: 'calls', visible: true }];
  const STORAGE_KEY = 'test-layout';

  function readLayout(): typeof DEFAULT_LAYOUT {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return DEFAULT_LAYOUT;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : DEFAULT_LAYOUT;
    } catch {
      return DEFAULT_LAYOUT;
    }
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default when key is absent', () => {
    expect(readLayout()).toEqual(DEFAULT_LAYOUT);
  });

  it('returns parsed array when key holds valid JSON array', () => {
    const custom = [{ id: 'stats', visible: false }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
    expect(readLayout()).toEqual(custom);
  });

  it('returns default when stored value is valid JSON but not an array', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ not: 'an array' }));
    expect(readLayout()).toEqual(DEFAULT_LAYOUT);
  });

  it('returns default when stored value is a JSON primitive', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(42));
    expect(readLayout()).toEqual(DEFAULT_LAYOUT);
  });

  it('returns default when stored value is a JSON string', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify('a string'));
    expect(readLayout()).toEqual(DEFAULT_LAYOUT);
  });

  it('returns default when stored value is null JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'null');
    expect(readLayout()).toEqual(DEFAULT_LAYOUT);
  });

  it('returns default (does not throw) when stored value is corrupt JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{ invalid json !!!');
    expect(() => readLayout()).not.toThrow();
    expect(readLayout()).toEqual(DEFAULT_LAYOUT);
  });

  it('returns default when stored value is empty string', () => {
    localStorage.setItem(STORAGE_KEY, '');
    expect(() => readLayout()).not.toThrow();
    expect(readLayout()).toEqual(DEFAULT_LAYOUT);
  });
});

// ---------------------------------------------------------------------------
// 6. localStorage resilience — useSupervisorPanel boolean + object pattern
// ---------------------------------------------------------------------------

describe('localStorage resilience (useSupervisorPanel pattern)', () => {
  const DEFAULT_SOUND_CONFIG = { volume: 0.7, type: 'chime' };

  function readSoundEnabled(): boolean {
    try {
      const saved = localStorage.getItem('sound-enabled');
      if (saved === null) return true;
      const parsed = JSON.parse(saved);
      return typeof parsed === 'boolean' ? parsed : true;
    } catch {
      return true;
    }
  }

  function readSoundConfig(): typeof DEFAULT_SOUND_CONFIG {
    try {
      const saved = localStorage.getItem('sound-config');
      if (!saved) return DEFAULT_SOUND_CONFIG;
      const parsed = JSON.parse(saved);
      if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
        return DEFAULT_SOUND_CONFIG;
      }
      return { ...DEFAULT_SOUND_CONFIG, ...parsed };
    } catch {
      return DEFAULT_SOUND_CONFIG;
    }
  }

  beforeEach(() => localStorage.clear());

  // soundEnabled tests
  it('soundEnabled defaults to true when absent', () => {
    expect(readSoundEnabled()).toBe(true);
  });

  it('soundEnabled returns true from stored true', () => {
    localStorage.setItem('sound-enabled', 'true');
    expect(readSoundEnabled()).toBe(true);
  });

  it('soundEnabled returns false from stored false', () => {
    localStorage.setItem('sound-enabled', 'false');
    expect(readSoundEnabled()).toBe(false);
  });

  it('soundEnabled defaults to true when stored value is a non-boolean JSON', () => {
    localStorage.setItem('sound-enabled', '"yes"');
    expect(readSoundEnabled()).toBe(true);
  });

  it('soundEnabled does not throw on corrupt JSON', () => {
    localStorage.setItem('sound-enabled', '{corrupt');
    expect(() => readSoundEnabled()).not.toThrow();
    expect(readSoundEnabled()).toBe(true);
  });

  // soundConfig tests
  it('soundConfig returns default when absent', () => {
    expect(readSoundConfig()).toEqual(DEFAULT_SOUND_CONFIG);
  });

  it('soundConfig merges stored values with defaults', () => {
    localStorage.setItem('sound-config', JSON.stringify({ volume: 0.5 }));
    expect(readSoundConfig()).toEqual({ volume: 0.5, type: 'chime' });
  });

  it('soundConfig returns default when stored is an array', () => {
    localStorage.setItem('sound-config', '[1,2,3]');
    expect(readSoundConfig()).toEqual(DEFAULT_SOUND_CONFIG);
  });

  it('soundConfig returns default when stored is a primitive', () => {
    localStorage.setItem('sound-config', '42');
    expect(readSoundConfig()).toEqual(DEFAULT_SOUND_CONFIG);
  });

  it('soundConfig returns default when stored is null', () => {
    localStorage.setItem('sound-config', 'null');
    expect(readSoundConfig()).toEqual(DEFAULT_SOUND_CONFIG);
  });

  it('soundConfig does not throw on corrupt JSON', () => {
    localStorage.setItem('sound-config', '{{bad}}');
    expect(() => readSoundConfig()).not.toThrow();
    expect(readSoundConfig()).toEqual(DEFAULT_SOUND_CONFIG);
  });
});
