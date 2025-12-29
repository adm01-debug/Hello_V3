import { z } from 'zod';

const DatabaseConfigSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().positive(),
  database: z.string().min(1),
  user: z.string().min(1),
  password: z.string().min(1),
  ssl: z.boolean().default(true),
  poolMin: z.number().int().nonnegative().default(2),
  poolMax: z.number().int().positive().default(10),
  idleTimeoutMs: z.number().int().positive().default(30000),
  connectionTimeoutMs: z.number().int().positive().default(5000),
});

type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

const CONFIG: DatabaseConfig = DatabaseConfigSchema.parse({
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  database: process.env.DB_NAME ?? 'hello',
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
  ssl: process.env.DB_SSL === 'true',
  poolMin: parseInt(process.env.DB_POOL_MIN ?? '2', 10),
  poolMax: parseInt(process.env.DB_POOL_MAX ?? '10', 10),
  idleTimeoutMs: parseInt(process.env.DB_IDLE_TIMEOUT ?? '30000', 10),
  connectionTimeoutMs: parseInt(process.env.DB_CONNECTION_TIMEOUT ?? '5000', 10),
});

export { CONFIG as DATABASE_CONFIG, DatabaseConfig };
