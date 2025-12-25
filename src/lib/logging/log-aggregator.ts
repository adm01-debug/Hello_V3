export interface LogAggregatorConfig {
  batchSize: number;
  flushInterval: number;
  endpoint?: string;
}

export interface Log {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any>;
}

export class LogAggregator {
  private buffer: Log[] = [];
  private config: LogAggregatorConfig;
  private flushTimer?: NodeJS.Timeout;

  constructor(config: Partial<LogAggregatorConfig> = {}) {
    this.config = {
      batchSize: config.batchSize || 100,
      flushInterval: config.flushInterval || 5000,
      endpoint: config.endpoint,
    };

    this.startFlushTimer();
  }

  add(log: Omit<Log, 'id'>) {
    const logEntry: Log = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.buffer.push(logEntry);

    if (this.buffer.length >= this.config.batchSize) {
      this.flush();
    }
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  async flush() {
    if (this.buffer.length === 0) return;

    const batch = [...this.buffer];
    this.buffer = [];

    try {
      await this.sendBatch(batch);
    } catch (error) {
      console.error('Failed to send log batch:', error);
      // Re-add to buffer on failure
      this.buffer.unshift(...batch);
    }
  }

  private async sendBatch(logs: Log[]) {
    if (!this.config.endpoint) {
      console.log('Log batch:', logs);
      return;
    }

    await fetch(this.config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs }),
    });
  }

  search(query: {
    level?: string;
    startTime?: string;
    endTime?: string;
    message?: string;
  }): Log[] {
    return this.buffer.filter(log => {
      if (query.level && log.level !== query.level) return false;
      if (query.message && !log.message.includes(query.message)) return false;
      if (query.startTime && log.timestamp < query.startTime) return false;
      if (query.endTime && log.timestamp > query.endTime) return false;
      return true;
    });
  }

  clear() {
    this.buffer = [];
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

export const logAggregator = new LogAggregator({
  endpoint: process.env.VITE_LOGS_ENDPOINT,
});
