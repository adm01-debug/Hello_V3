export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  traceId?: string;
  spanId?: string;
  userId?: string;
  stack?: string;
}

export class StructuredLogger {
  private context: Record<string, any> = {};
  private minLevel: LogLevel = 'info';

  constructor(defaultContext?: Record<string, any>) {
    if (defaultContext) {
      this.context = defaultContext;
    }
    
    const envLevel = process.env.LOG_LEVEL as LogLevel;
    if (envLevel) {
      this.minLevel = envLevel;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatEntry(entry: LogEntry): string {
    return JSON.stringify(entry);
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
    };

    if (error) {
      entry.stack = error.stack;
    }

    const formatted = this.formatEntry(entry);

    switch (level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>, error?: Error) {
    this.log('error', message, context, error);
  }

  setContext(key: string, value: any) {
    this.context[key] = value;
  }

  clearContext() {
    this.context = {};
  }

  child(context: Record<string, any>): StructuredLogger {
    return new StructuredLogger({ ...this.context, ...context });
  }
}

export const logger = new StructuredLogger({
  service: 'hello',
  environment: process.env.NODE_ENV || 'development',
});
