import pino from 'pino';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

export const logger = pino({
  level: LOG_LEVEL,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});

export const logRequest = (method: string, url: string, statusCode: number, duration: number) => {
  logger.info({
    type: 'http_request',
    method,
    url,
    statusCode,
    duration,
  });
};

export const logError = (error: Error, context?: Record<string, unknown>) => {
  logger.error({
    type: 'error',
    message: error.message,
    stack: error.stack,
    ...context,
  });
};
