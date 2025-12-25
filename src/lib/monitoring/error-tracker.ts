export interface ErrorTrackingConfig {
  dsn: string;
  environment: string;
  release?: string;
  sampleRate: number;
}

export interface ErrorContext {
  user?: { id: string; email?: string };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

export class ErrorTracker {
  private config: ErrorTrackingConfig;
  private enabled: boolean = false;

  constructor(config: ErrorTrackingConfig) {
    this.config = config;
    this.initialize();
  }

  private initialize() {
    if (typeof window !== 'undefined' && this.config.dsn) {
      this.enabled = true;
      console.log('Error tracking initialized');
    }
  }

  captureException(error: Error, context?: ErrorContext) {
    if (!this.enabled) {
      console.error('Error:', error);
      return;
    }

    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
      release: this.config.release,
      ...context,
    };

    console.error('Captured exception:', errorData);
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
    if (!this.enabled) return;

    const messageData = {
      message,
      level,
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
      ...context,
    };

    console.log('Captured message:', messageData);
  }

  setUser(user: { id: string; email?: string; username?: string }) {
    if (!this.enabled) return;
    console.log('User set:', user);
  }

  setTag(key: string, value: string) {
    if (!this.enabled) return;
    console.log('Tag set:', key, value);
  }

  setContext(name: string, context: Record<string, any>) {
    if (!this.enabled) return;
    console.log('Context set:', name, context);
  }

  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: 'info' | 'warning' | 'error';
    data?: Record<string, any>;
  }) {
    if (!this.enabled) return;
    console.log('Breadcrumb:', breadcrumb);
  }
}

export const errorTracker = new ErrorTracker({
  dsn: process.env.VITE_SENTRY_DSN || '',
  environment: process.env.NODE_ENV || 'development',
  release: process.env.VITE_APP_VERSION,
  sampleRate: 1.0,
});
