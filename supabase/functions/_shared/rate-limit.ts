import { RateLimiter, RATE_LIMIT_CONFIGS } from '../../../src/lib/security/rate-limiter.ts';

export const edgeRateLimiters = {
  general: new RateLimiter({ windowMs: 60000, maxRequests: 100, message: 'Too many requests' }),
  auth: new RateLimiter(RATE_LIMIT_CONFIGS.AUTH),
  calls: new RateLimiter(RATE_LIMIT_CONFIGS.CALLS),
  transcriptions: new RateLimiter(RATE_LIMIT_CONFIGS.TRANSCRIPTIONS),
  webhooks: new RateLimiter({ windowMs: 60000, maxRequests: 10, message: 'Too many webhook requests' }),
};

export const applyEdgeRateLimit = (type: keyof typeof edgeRateLimiters = 'general') => {
  const limiter = edgeRateLimiters[type];
  
  return async (req: Request): Promise<Response | null> => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const { allowed, remaining, resetTime } = limiter.check(ip);
    
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many requests', retryAfter: Math.ceil((resetTime - Date.now()) / 1000) }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limiter.config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(resetTime).toISOString(),
          },
        }
      );
    }
    
    return null;
  };
};
