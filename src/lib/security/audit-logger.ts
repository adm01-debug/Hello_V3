import { RedisClient } from '../cache/redis-client';

interface AuditEvent {
  readonly timestamp: string;
  readonly userId: string;
  readonly action: string;
  readonly resourceId?: string;
  readonly metadata?: Record<string, unknown>;
  readonly ipAddress: string;
  readonly userAgent?: string;
  readonly success: boolean;
}

const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'apiKey', 'ssn', 'creditCard'] as const;

class AuditLogger {
  private readonly redis: RedisClient;
  private readonly batchSize: number;
  private readonly flushInterval: number;
  private batch: AuditEvent[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(redis: RedisClient, batchSize: number = 100, flushInterval: number = 5000) {
    this.redis = redis;
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
    this.startFlushTimer();
  }

  public logAccess(userId: string, action: string, resourceId?: string, metadata?: Record<string, unknown>): void {
    const event: AuditEvent = {
      timestamp: new Date().toISOString(),
      userId,
      action,
      resourceId,
      metadata: this.sanitizeMetadata(metadata),
      ipAddress: (metadata?.ip as string) ?? 'unknown',
      userAgent: metadata?.userAgent as string,
      success: true,
    };

    this.addToBatch(event);
  }

  public logFailedAccess(userId: string, action: string, reason: string, ipAddress: string): void {
    const event: AuditEvent = {
      timestamp: new Date().toISOString(),
      userId,
      action,
      metadata: { reason },
      ipAddress,
      success: false,
    };

    this.addToBatch(event);
  }

  public logLogin(userId: string, ipAddress: string, userAgent: string, success: boolean): void {
    const event: AuditEvent = {
      timestamp: new Date().toISOString(),
      userId,
      action: 'login',
      ipAddress,
      userAgent,
      success,
    };

    this.addToBatch(event);
  }

  private sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!metadata) return undefined;

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '***REDACTED***';
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private addToBatch(event: AuditEvent): void {
    this.batch.push(event);
    if (this.batch.length >= this.batchSize) {
      void this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.batch.length === 0) return;

    const eventsToFlush = [...this.batch];
    this.batch = [];

    try {
      const key = `audit:${new Date().toISOString().split('T')[0]}`;
      await this.redis.lpush(key, ...eventsToFlush.map(e => JSON.stringify(e)));
      await this.redis.expire(key, 2592000);
    } catch (error) {
      console.error('Failed to flush audit log:', error);
      this.batch.unshift(...eventsToFlush);
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      void this.flush();
    }, this.flushInterval);
  }

  public async shutdown(): Promise<void> {
    if (this.flushTimer) clearInterval(this.flushTimer);
    await this.flush();
  }
}

export { AuditLogger, AuditEvent };
