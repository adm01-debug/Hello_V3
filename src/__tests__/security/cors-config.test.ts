import { describe, it, expect } from 'vitest';
import { getCORSConfig, isOriginAllowed, CORS_PROD_CONFIG } from '@/lib/security/cors-config';

describe('CORS Configuration', () => {
  it('should allow origin in production config', () => {
    const allowed = isOriginAllowed('https://hello.app', CORS_PROD_CONFIG);
    expect(allowed).toBe(true);
  });
  
  it('should block unauthorized origin in production', () => {
    const allowed = isOriginAllowed('https://malicious.com', CORS_PROD_CONFIG);
    expect(allowed).toBe(false);
  });
  
  it('should return correct config based on environment', () => {
    const config = getCORSConfig();
    expect(config).toBeDefined();
    expect(config.methods).toContain('GET');
  });
});
