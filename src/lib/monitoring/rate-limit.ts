export class RateLimitMonitor {
  private limits: Map<string, LimitMetrics> = new Map();

  recordRequest(endpoint: string, userId: string, allowed: boolean) {
    const key = `${endpoint}:${userId}`;
    const metrics = this.limits.get(key) || {
      endpoint,
      userId,
      totalRequests: 0,
      blockedRequests: 0,
      lastRequest: new Date(),
    };

    metrics.totalRequests++;
    if (!allowed) metrics.blockedRequests++;
    metrics.lastRequest = new Date();

    this.limits.set(key, metrics);
  }

  getMetrics(endpoint: string, userId: string): LimitMetrics | undefined {
    return this.limits.get(`${endpoint}:${userId}`);
  }

  getBlockedRate(endpoint: string): number {
    const metrics = Array.from(this.limits.values())
      .filter(m => m.endpoint === endpoint);
    
    if (metrics.length === 0) return 0;

    const total = metrics.reduce((sum, m) => sum + m.totalRequests, 0);
    const blocked = metrics.reduce((sum, m) => sum + m.blockedRequests, 0);
    
    return (blocked / total) * 100;
  }
}

interface LimitMetrics {
  endpoint: string;
  userId: string;
  totalRequests: number;
  blockedRequests: number;
  lastRequest: Date;
}
