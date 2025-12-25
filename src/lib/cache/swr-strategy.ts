import { RedisCache } from './redis-client'

export class SWRCache {
  static async getWithFallback<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    const cached = await RedisCache.get<T>(key)
    
    if (cached) {
      // Return cached, refresh in background
      fetcher().then(fresh => RedisCache.set(key, fresh, ttl))
      return cached
    }

    const fresh = await fetcher()
    await RedisCache.set(key, fresh, ttl)
    return fresh
  }
}
