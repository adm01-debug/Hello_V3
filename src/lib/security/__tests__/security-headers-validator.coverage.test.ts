import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateHeaders,
  getSecurityScore,
  type HeaderValidationResult,
} from '../security-headers-validator';

interface FakeHeaders {
  has: (h: string) => boolean;
  get: (h: string) => string | null;
}

function makeResponse(headers: FakeHeaders): { headers: FakeHeaders } {
  return { headers };
}

describe('security-headers-validator', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns all headers present when fetch succeeds', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      makeResponse({ has: () => true, get: () => 'value' }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const results = await validateHeaders('https://example.com');
    expect(results).toHaveLength(7);
    expect(results.every((r) => r.present)).toBe(true);
    expect(results.every((r) => r.value === 'value')).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith('https://example.com', { method: 'HEAD' });
    expect(getSecurityScore(results)).toBe(100);
  });

  it('returns all headers absent when fetch rejects', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network'));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const results = await validateHeaders('https://bad.example.com');
    expect(results).toHaveLength(7);
    expect(results.every((r) => r.present === false)).toBe(true);
    expect(results.every((r) => r.value === null)).toBe(true);
    expect(getSecurityScore(results)).toBe(0);
  });

  it('handles a mixed set of present/absent headers', async () => {
    const presentSet = new Set(['X-Content-Type-Options', 'X-Frame-Options']);
    const fetchMock = vi.fn().mockResolvedValue(
      makeResponse({
        has: (h: string) => presentSet.has(h),
        get: (h: string) => (presentSet.has(h) ? 'nosniff' : null),
      }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const results = await validateHeaders('https://mixed.example.com');
    expect(results).toHaveLength(7);
    const present = results.filter((r) => r.present);
    expect(present).toHaveLength(2);
    // 2 / 7 = 28.57 -> 29
    expect(getSecurityScore(results)).toBe(29);
  });

  it('getSecurityScore computes round percentage from arbitrary results', () => {
    const results: HeaderValidationResult[] = [
      { header: 'a', present: true, value: 'x', recommendation: '' },
      { header: 'b', present: false, value: null, recommendation: '' },
    ];
    expect(getSecurityScore(results)).toBe(50);
  });
});
