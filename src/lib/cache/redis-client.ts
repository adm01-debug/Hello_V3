import Redis, { RedisOptions } from 'ioredis';

interface CacheOptions {
  readonly ttl?: number;
  readonly prefix?: string;
}

const DEFAULT_CONFIG: RedisOptions = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: 0,
  retryStrategy: (times: number): number | null => {
    if (times > 10) return null;
    return Math.min(times * 100, 3000);
  },
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  lazyConnect: false,
};

class RedisClient {
  private client: Redis;
  private readonly prefix: string;

  constructor(config: RedisOptions = {}, prefix: string = 'app') {
    this.client = new Redis({ ...DEFAULT_CONFIG, ...config });
    this.prefix = prefix;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => console.log('Redis: Connected'));
    this.client.on('ready', () => console.log('Redis: Ready'));
    this.client.on('error', (err) => console.error('Redis error:', err));
    this.client.on('close', () => console.log('Redis: Connection closed'));
    this.client.on('reconnecting', () => console.log('Redis: Reconnecting...'));
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  public async get(key: string): Promise<string | null> {
    return this.client.get(this.getKey(key));
  }

  public async set(key: string, value: string, ttl?: number): Promise<void> {
    const fullKey = this.getKey(key);
    if (ttl) {
      await this.client.setex(fullKey, ttl, value);
    } else {
      await this.client.set(fullKey, value);
    }
  }

  public async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  public async setJSON<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttl);
  }

  public async del(key: string): Promise<void> {
    await this.client.del(this.getKey(key));
  }

  public async exists(key: string): Promise<number> {
    return this.client.exists(this.getKey(key));
  }

  public async incr(key: string): Promise<number> {
    return this.client.incr(this.getKey(key));
  }

  public async decr(key: string): Promise<number> {
    return this.client.decr(this.getKey(key));
  }

  public async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(this.getKey(key), seconds);
  }

  public async lpush(key: string, ...values: string[]): Promise<void> {
    await this.client.lpush(this.getKey(key), ...values);
  }

  public async ping(): Promise<boolean> {
    try {
      const response = await this.client.ping();
      return response === 'PONG';
    } catch {
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    await this.client.quit();
  }

  public getClient(): Redis {
    return this.client;
  }
}

export { RedisClient, CacheOptions };
