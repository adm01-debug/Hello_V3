import { Pool, PoolConfig } from 'pg';

interface ConnectionPoolConfig extends PoolConfig {
  min?: number;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

const DEFAULT_POOL_CONFIG: ConnectionPoolConfig = {
  min: 2,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export class DatabaseConnectionPool {
  private pool: Pool;
  private config: ConnectionPoolConfig;

  constructor(config: ConnectionPoolConfig = {}) {
    this.config = {
      ...DEFAULT_POOL_CONFIG,
      ...config,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'hello',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    };

    this.pool = new Pool(this.config);
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.pool.on('connect', (client) => {
      console.log('New client connected to database');
    });

    this.pool.on('acquire', (client) => {
      console.log('Client acquired from pool');
    });

    this.pool.on('remove', (client) => {
      console.log('Client removed from pool');
    });

    this.pool.on('error', (err, client) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      if (duration > 100) {
        console.warn(`Slow query (${duration}ms):`, text);
      }
      
      return res;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getStats() {
    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount,
    };
  }

  async end() {
    await this.pool.end();
  }
}

export const db = new DatabaseConnectionPool();
