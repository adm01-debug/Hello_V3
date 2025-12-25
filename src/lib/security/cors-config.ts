/**
 * CORS Configuration
 * Gerencia políticas de Cross-Origin Resource Sharing
 */

export interface CORSConfig {
  origin: string | string[] | boolean;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
  preflightContinue: boolean;
  optionsSuccessStatus: number;
}

export const CORS_DEV_CONFIG: CORSConfig = {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

export const CORS_PROD_CONFIG: CORSConfig = {
  origin: ['https://hello.app', 'https://www.hello.app', 'https://app.hello.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

export const getCORSConfig = (): CORSConfig => {
  const env = import.meta.env.MODE;
  return env === 'production' ? CORS_PROD_CONFIG : CORS_DEV_CONFIG;
};

export const isOriginAllowed = (origin: string, config: CORSConfig): boolean => {
  if (typeof config.origin === 'boolean') return config.origin;
  if (typeof config.origin === 'string') return origin === config.origin;
  if (Array.isArray(config.origin)) return config.origin.includes(origin);
  return false;
};

export const corsMiddleware = (config: CORSConfig = getCORSConfig()) => {
  return (req: any, res: any, next: any) => {
    const origin = req.headers.origin || req.headers.referer;
    
    if (origin && isOriginAllowed(origin, config)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', config.methods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
    
    if (config.exposedHeaders.length > 0) {
      res.setHeader('Access-Control-Expose-Headers', config.exposedHeaders.join(', '));
    }
    
    if (config.credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    
    res.setHeader('Access-Control-Max-Age', config.maxAge.toString());
    
    if (req.method === 'OPTIONS') {
      res.status(config.optionsSuccessStatus).end();
      return;
    }
    
    next();
  };
};
