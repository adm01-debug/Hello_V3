import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: import.meta.env.VITE_UPSTASH_REDIS_URL || '',
  token: import.meta.env.VITE_UPSTASH_REDIS_TOKEN || '',
})

export class RedisCache {
  static async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key)
    return data as T | null
  }

  static async set(key: string, value: any, ttl?: number): Promise<void> {
    if (ttl) {
      await redis.setex(key, ttl, JSON.stringify(value))
    } else {
      await redis.set(key, JSON.stringify(value))
    }
  }

  static async delete(key: string): Promise<void> {
    await redis.del(key)
  }

  static async invalidatePattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }
}
