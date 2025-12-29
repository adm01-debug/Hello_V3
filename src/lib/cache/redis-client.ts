import Redis, { RedisOptions } from 'ioredis';

const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (err: Error) => {
    const targetErrors = ['READONLY', 'ECONNREFUSED'];
    return targetErrors.some(target => err.message.includes(target));
  },
  enableReadyCheck: true,
  enableOfflineQueue: true,
  lazyConnect: false,
  connectTimeout: 10000,
  commandTimeout: 5000,
};

class RedisClient {
  private client: Redis;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Redis(redisConfig);
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('connect', () => {
      console.log('Redis client connected');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      console.log('Redis client ready');
    });

    this.client.on('error', (err: Error) => {
      console.error('Redis client error:', err);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      console.log('Redis client closed');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      console.log('Redis client reconnecting');
    });
  }

  // Basic operations with error handling
  async get(key: string): Promise<string | null> {
    try {
      if (!this.isConnected) throw new Error('Redis not connected');
      return await this.client.get(key);
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      if (!this.isConnected) throw new Error('Redis not connected');
      if (ttl) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string | string[]): Promise<number> {
    try {
      if (!this.isConnected) throw new Error('Redis not connected');
      const keys = Array.isArray(key) ? key : [key];
      return await this.client.del(...keys);
    } catch (error) {
      console.error(`Redis DEL error:`, error);
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      if (!this.isConnected) throw new Error('Redis not connected');
      const result = await this.client.expire(key, seconds);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXPIRE error for key ${key}:`, error);
      return false;
    }
  }

  // JSON operations
  async getJSON<T>(key: string): Promise<T | null> {
    try {
      const value = await this.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Redis GET JSON error for key ${key}:`, error);
      return null;
    }
  }

  async setJSON<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      return await this.set(key, serialized, ttl);
    } catch (error) {
      console.error(`Redis SET JSON error for key ${key}:`, error);
      return false;
    }
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | null> {
    try {
      if (!this.isConnected) throw new Error('Redis not connected');
      return await this.client.hget(key, field);
    } catch (error) {
      console.error(`Redis HGET error:`, error);
      return null;
    }
  }

  async hset(key: string, field: string, value: string): Promise<boolean> {
    try {
      if (!this.isConnected) throw new Error('Redis not connected');
      await this.client.hset(key, field, value);
      return true;
    } catch (error) {
      console.error(`Redis HSET error:`, error);
      return false;
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      if (!this.isConnected) throw new Error('Redis not connected');
      return await this.client.hgetall(key);
    } catch (error) {
      console.error(`Redis HGETALL error:`, error);
      return {};
    }
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      if (!this.isConnected) throw new Error('Redis not connected');
      return await this.client.lpush(key, ...values);
    } catch (error) {
      console.error(`Redis LPUSH error:`, error);
      return 0;
    }
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    try {
      if (!this.isConnected) throw new Error('Redis not connected');
      return await this.client.rpush(key, ...values);
    } catch (error) {
      console.error(`Redis RPUSH error:`, error);
      return 0;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      if (!this.isConnected) throw new Error('Redis not connected');
      return await this.client.lrange(key, start, stop);
    } catch (error) {
      console.error(`Redis LRANGE error:`, error);
      return [];
    }
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      if (!this.isConnected) throw new Error('Redis not connected');
      return await this.client.sadd(key, ...members);
    } catch (error) {
      console.error(`Redis SADD error:`, error);
      return 0;
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      if (!this.isConnected) throw new Error('Redis not connected');
      return await this.client.smembers(key);
    } catch (error) {
      console.error(`Redis SMEMBERS error:`, error);
      return [];
    }
  }

  // Pub/Sub
  async publish(channel: string, message: string): Promise<number> {
    try {
      if (!this.isConnected) throw new Error('Redis not connected');
      return await this.client.publish(channel, message);
    } catch (error) {
      console.error(`Redis PUBLISH error:`, error);
      return 0;
    }
  }

  subscribe(channel: string, callback: (message: string) => void): void {
    const subscriber = this.client.duplicate();
    subscriber.subscribe(channel);
    subscriber.on('message', (ch: string, msg: string) => {
      if (ch === channel) callback(msg);
    });
  }

  // Pattern-based operations
  async keys(pattern: string): Promise<string[]> {
    try {
      if (!this.isConnected) throw new Error('Redis not connected');
      return await this.client.keys(pattern);
    } catch (error) {
      console.error(`Redis KEYS error:`, error);
      return [];
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.keys(pattern);
      if (keys.length === 0) return 0;
      return await this.del(keys);
    } catch (error) {
      console.error(`Redis DELETE PATTERN error:`, error);
      return 0;
    }
  }

  // Atomic increment/decrement
  async incr(key: string): Promise<number> {
    try {
      if (!this.isConnected) throw new Error('Redis not connected');
      return await this.client.incr(key);
    } catch (error) {
      console.error(`Redis INCR error:`, error);
      return 0;
    }
  }

  async decr(key: string): Promise<number> {
    try {
      if (!this.isConnected) throw new Error('Redis not connected');
      return await this.client.decr(key);
    } catch (error) {
      console.error(`Redis DECR error:`, error);
      return 0;
    }
  }

  // Cache pattern
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 300
  ): Promise<T | null> {
    try {
      // Try to get from cache
      const cached = await this.getJSON<T>(key);
      if (cached !== null) return cached;

      // Fetch fresh data
      const fresh = await fetchFn();
      if (fresh !== null) {
        await this.setJSON(key, fresh, ttl);
      }
      
      return fresh;
    } catch (error) {
      console.error(`Redis GET_OR_SET error for key ${key}:`, error);
      return null;
    }
  }

  // Distributed lock
  async acquireLock(
    lockKey: string,
    timeout: number = 10000
  ): Promise<boolean> {
    try {
      if (!this.isConnected) throw new Error('Redis not connected');
      const result = await this.client.set(
        lockKey,
        '1',
        'PX',
        timeout,
        'NX'
      );
      return result === 'OK';
    } catch (error) {
      console.error(`Redis ACQUIRE LOCK error:`, error);
      return false;
    }
  }

  async releaseLock(lockKey: string): Promise<boolean> {
    try {
      const result = await this.del(lockKey);
      return result > 0;
    } catch (error) {
      console.error(`Redis RELEASE LOCK error:`, error);
      return false;
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis PING error:', error);
      return false;
    }
  }

  // Stats
  async info(): Promise<string> {
    try {
      if (!this.isConnected) throw new Error('Redis not connected');
      return await this.client.info();
    } catch (error) {
      console.error('Redis INFO error:', error);
      return '';
    }
  }

  // Cleanup
  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
    } catch (error) {
      console.error('Redis DISCONNECT error:', error);
    }
  }
}

// Singleton instance
export const redis = new RedisClient();

export default redis;
