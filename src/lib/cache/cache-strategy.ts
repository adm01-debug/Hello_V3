import { RedisClient } from '../cache/redis-client';

export class CacheStrategy {
  constructor(private readonly redis: RedisClient) {}

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    const cached = await this.redis.getJSON<T>(key);
    if (cached) return cached;

    const fresh = await fetcher();
    await this.redis.setJSON(key, fresh, ttl);
    return fresh;
  }

  async invalidate(pattern: string): Promise<void> {
    // Implement pattern-based invalidation
  }
}
