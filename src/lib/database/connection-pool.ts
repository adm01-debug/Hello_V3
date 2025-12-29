import { Pool, PoolConfig, PoolClient, QueryResult } from 'pg';

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'hello',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  min: parseInt(process.env.DB_POOL_MIN || '2'),
  max: parseInt(process.env.DB_POOL_MAX || '10'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT || '10000'),
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'),
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
  allowExitOnIdle: false,
};

class DatabasePool {
  private pool: Pool;
  private queryCount: number = 0;
  private errorCount: number = 0;

  constructor() {
    this.pool = new Pool(poolConfig);
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.pool.on('connect', (client: PoolClient) => {
      console.log('New client connected to pool');
      client.on('error', (err: Error) => {
        console.error('Idle client error:', err);
        this.errorCount++;
      });
    });

    this.pool.on('acquire', () => {
      console.log('Client acquired from pool');
    });

    this.pool.on('remove', () => {
      console.log('Client removed from pool');
    });

    this.pool.on('error', (err: Error) => {
      console.error('Pool error:', err);
      this.errorCount++;
    });
  }

  // Execute query with automatic client release
  async query<T = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    
    try {
      this.queryCount++;
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      
      if (duration > 1000) {
        console.warn(`Slow query detected (${duration}ms):`, text.substring(0, 100));
      }
      
      return result;
    } catch (error) {
      this.errorCount++;
      console.error('Query error:', error);
      console.error('Query:', text);
      console.error('Params:', params);
      throw error;
    }
  }

  // Execute query with explicit client management
  async withClient<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      return await callback(client);
    } finally {
      client.release();
    }
  }

  // Transaction helper
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction rolled back:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Batch insert helper
  async batchInsert(
    table: string,
    columns: string[],
    values: any[][],
    onConflict?: string
  ): Promise<number> {
    if (values.length === 0) return 0;
    
    const placeholders = values
      .map((_, i) => {
        const offset = i * columns.length;
        const params = columns.map((_, j) => `$${offset + j + 1}`).join(', ');
        return `(${params})`;
      })
      .join(', ');
    
    const flatValues = values.flat();
    const query = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES ${placeholders}
      ${onConflict || ''}
    `;
    
    const result = await this.query(query, flatValues);
    return result.rowCount || 0;
  }

  // Pool statistics
  getStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      queryCount: this.queryCount,
      errorCount: this.errorCount,
      config: {
        min: poolConfig.min,
        max: poolConfig.max,
        idleTimeout: poolConfig.idleTimeoutMillis,
      },
    };
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health');
      return result.rows[0]?.health === 1;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Graceful shutdown
  async end(): Promise<void> {
    try {
      await this.pool.end();
      console.log('Database pool closed');
    } catch (error) {
      console.error('Error closing pool:', error);
    }
  }
}

// Singleton instance
export const db = new DatabasePool();

export default db;
