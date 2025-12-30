import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV;

export const initSentry = (): void => {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    debug: ENVIRONMENT === 'development',
    
    beforeSend(event, hint) {
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
      }
      return event;
    },
    
    integrations: [
      new Sentry.BrowserTracing({
        tracePropagationTargets: ['localhost', /^https:\/\/api\.hello\.app/],
      }),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
};

export const captureException = (error: Error, context?: Record<string, unknown>): void => {
  Sentry.captureException(error, { contexts: { custom: context } });
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info'): void => {
  Sentry.captureMessage(message, level);
};

export const setUser = (user: { id: string; email: string }): void => {
  Sentry.setUser(user);
};

export const clearUser = (): void => {
  Sentry.setUser(null);
};
