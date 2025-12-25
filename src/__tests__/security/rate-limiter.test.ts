import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter } from '@/lib/security/rate-limiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;
  
  beforeEach(() => {
    limiter = new RateLimiter({ windowMs: 1000, maxRequests: 5 });
  });
  
  it('should allow requests within limit', () => {
    for (let i = 0; i < 5; i++) {
      const result = limiter.check('test-key');
      expect(result.allowed).toBe(true);
    }
  });
  
  it('should block requests over limit', () => {
    for (let i = 0; i < 5; i++) limiter.check('test-key');
    const result = limiter.check('test-key');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
});
