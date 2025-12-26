import NodeCache from 'node-cache';

export interface QueryCacheOptions {
  ttl?: number;
  checkPeriod?: number;
  maxKeys?: number;
}

const DEFAULT_OPTIONS: QueryCacheOptions = {
  ttl: 300, // 5 minutes
  checkPeriod: 60, // Check for expired keys every minute
  maxKeys: 1000,
};

export class QueryCache {
  private cache: NodeCache;
  private hits: number = 0;
  private misses: number = 0;

  constructor(options: QueryCacheOptions = {}) {
    const config = { ...DEFAULT_OPTIONS, ...options };
    
    this.cache = new NodeCache({
      stdTTL: config.ttl,
      checkperiod: config.checkPeriod,
      maxKeys: config.maxKeys,
      useClones: false,
    });

    this.cache.on('expired', (key, value) => {
      console.log(`Cache key expired: ${key}`);
    });
  }

  private generateKey(query: string, params: any[]): string {
    return `${query}:${JSON.stringify(params)}`;
  }

  async get<T>(
    query: string,
    params: any[],
    fetcher: () => Promise<T>,
    options?: { ttl?: number }
  ): Promise<T> {
    const key = this.generateKey(query, params);
    const cached = this.cache.get<T>(key);

    if (cached !== undefined) {
      this.hits++;
      return cached;
    }

    this.misses++;
    const result = await fetcher();
    
    this.cache.set(key, result, options?.ttl);
    return result;
  }

  invalidate(query: string, params?: any[]) {
    if (params) {
      const key = this.generateKey(query, params);
      this.cache.del(key);
    } else {
      // Invalidate all queries matching pattern
      const keys = this.cache.keys();
      const pattern = new RegExp(`^${query}:`);
      
      keys.forEach((key) => {
        if (pattern.test(key)) {
          this.cache.del(key);
        }
      });
    }
  }

  invalidateAll() {
    this.cache.flushAll();
  }

  getStats() {
    const stats = this.cache.getStats();
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: hitRate.toFixed(2) + '%',
      keys: stats.keys,
    };
  }
}

// Global query cache instance
export const queryCache = new QueryCache({
  ttl: 300,
  maxKeys: 5000,
});

// Helper function for cached queries
export async function cachedQuery<T>(
  query: string,
  params: any[],
  fetcher: () => Promise<T>,
  options?: { ttl?: number }
): Promise<T> {
  return queryCache.get(query, params, fetcher, options);
}

// Decorator for caching methods
export function CacheQuery(ttl?: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}.${propertyKey}`;
      return queryCache.get(
        cacheKey,
        args,
        () => originalMethod.apply(this, args),
        { ttl }
      );
    };

    return descriptor;
  };
}
