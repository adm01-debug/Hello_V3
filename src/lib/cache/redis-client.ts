import Redis from 'ioredis';

export interface RedisConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
}

const DEFAULT_CONFIG: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  db: 0,
  keyPrefix: 'hello:',
};

export class RedisClient {
  private client: Redis;
  private subscriber: Redis;

  constructor(config: RedisConfig = {}) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    
    this.client = new Redis(finalConfig);
    this.subscriber = new Redis(finalConfig);

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('connect', () => {
      console.log('Redis client connected');
    });

    this.client.on('error', (err) => {
      console.error('Redis client error:', err);
    });

    this.subscriber.on('connect', () => {
      console.log('Redis subscriber connected');
    });
  }

  // Basic operations
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setex(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  // JSON operations
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    return value ? JSON.parse(value) : null;
  }

  async setJSON<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttl);
  }

  // Hash operations
  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  async hmset(key: string, data: Record<string, string>): Promise<void> {
    await this.client.hmset(key, data);
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<void> {
    await this.client.lpush(key, ...values);
  }

  async rpop(key: string): Promise<string | null> {
    return this.client.rpop(key);
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<void> {
    await this.client.sadd(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  // Pub/Sub
  async publish(channel: string, message: string): Promise<void> {
    await this.client.publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch, msg) => {
      if (ch === channel) {
        callback(msg);
      }
    });
  }

  // Cache pattern
  async cache<T>(
    key: string,
    ttl: number,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = await this.getJSON<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.setJSON(key, value, ttl);
    return value;
  }

  // Distributed lock
  async lock(key: string, ttl: number = 10): Promise<boolean> {
    const result = await this.client.set(key, '1', 'EX', ttl, 'NX');
    return result === 'OK';
  }

  async unlock(key: string): Promise<void> {
    await this.del(key);
  }

  // Close connections
  async disconnect(): Promise<void> {
    await this.client.quit();
    await this.subscriber.quit();
  }
}

// Global Redis instance
export const redis = new RedisClient();

// Session store
export class RedisSessionStore {
  private redis: RedisClient;
  private prefix: string;

  constructor(redis: RedisClient, prefix: string = 'session:') {
    this.redis = redis;
    this.prefix = prefix;
  }

  async get(sessionId: string): Promise<any | null> {
    return this.redis.getJSON(this.prefix + sessionId);
  }

  async set(sessionId: string, session: any, ttl: number = 3600): Promise<void> {
    await this.redis.setJSON(this.prefix + sessionId, session, ttl);
  }

  async destroy(sessionId: string): Promise<void> {
    await this.redis.del(this.prefix + sessionId);
  }

  async touch(sessionId: string, ttl: number = 3600): Promise<void> {
    const session = await this.get(sessionId);
    if (session) {
      await this.set(sessionId, session, ttl);
    }
  }
}
