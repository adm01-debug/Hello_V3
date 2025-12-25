export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

export const RATE_LIMIT_CONFIGS = {
  GENERAL: { windowMs: 60000, maxRequests: 100, message: 'Too many requests' },
  AUTH: { windowMs: 60000, maxRequests: 10, message: 'Too many login attempts', skipSuccessfulRequests: true },
  SIGNUP: { windowMs: 60000, maxRequests: 5, message: 'Too many signup attempts' },
  CALLS: { windowMs: 60000, maxRequests: 30, message: 'Too many call requests' },
  TRANSCRIPTIONS: { windowMs: 60000, maxRequests: 50, message: 'Too many transcription requests' },
};

export class RateLimiter {
  private store: RateLimitStore = {};
  public config: RateLimitConfig;
  
  constructor(config: RateLimitConfig) {
    this.config = config;
    setInterval(() => this.cleanup(), this.config.windowMs);
  }
  
  check(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = this.store[key];
    
    if (!record || now > record.resetTime) {
      this.store[key] = { count: 1, resetTime: now + this.config.windowMs };
      return { allowed: true, remaining: this.config.maxRequests - 1, resetTime: this.store[key].resetTime };
    }
    
    record.count++;
    const remaining = Math.max(0, this.config.maxRequests - record.count);
    const allowed = record.count <= this.config.maxRequests;
    
    return { allowed, remaining, resetTime: record.resetTime };
  }
  
  reset(key: string): void {
    delete this.store[key];
  }
  
  private cleanup(): void {
    const now = Date.now();
    for (const key in this.store) {
      if (this.store[key].resetTime < now) delete this.store[key];
    }
  }
  
  getStats(): { totalKeys: number; totalRequests: number } {
    const totalKeys = Object.keys(this.store).length;
    const totalRequests = Object.values(this.store).reduce((sum, r) => sum + r.count, 0);
    return { totalKeys, totalRequests };
  }
}

export const rateLimiters = {
  general: new RateLimiter(RATE_LIMIT_CONFIGS.GENERAL),
  auth: new RateLimiter(RATE_LIMIT_CONFIGS.AUTH),
  signup: new RateLimiter(RATE_LIMIT_CONFIGS.SIGNUP),
  calls: new RateLimiter(RATE_LIMIT_CONFIGS.CALLS),
  transcriptions: new RateLimiter(RATE_LIMIT_CONFIGS.TRANSCRIPTIONS),
};

export const rateLimitMiddleware = (limiter: RateLimiter) => {
  return (req: any, res: any, next: any) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userId = req.user?.id;
    const key = userId ? `user:${userId}` : `ip:${ip}`;
    
    const { allowed, remaining, resetTime } = limiter.check(key);
    
    res.setHeader('X-RateLimit-Limit', limiter.config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString());
    
    if (!allowed) {
      res.status(429).json({
        error: limiter.config.message || 'Too many requests',
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
      });
      return;
    }
    
    next();
  };
};
