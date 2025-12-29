import { CorsOptions } from 'cors';

const ALLOWED_ORIGINS: Record<string, string[]> = {
  production: [
    'https://hello.app',
    'https://www.hello.app',
    'https://api.hello.app',
  ],
  staging: [
    'https://staging.hello.app',
    'https://api-staging.hello.app',
  ],
  development: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
  ],
};

export const corsConfig: CorsOptions = {
  origin: (origin, callback) => {
    const env = process.env.NODE_ENV || 'development';
    const allowedOrigins = ALLOWED_ORIGINS[env] || ALLOWED_ORIGINS.development;
    
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) {
      return callback(null, true);
    }
    
    // Validate origin
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Route-specific CORS for API endpoints
export const apiCorsConfig: CorsOptions = {
  ...corsConfig,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};

// Strict CORS for admin endpoints
export const adminCorsConfig: CorsOptions = {
  ...corsConfig,
  origin: (origin, callback) => {
    const adminOrigins = ['https://admin.hello.app'];
    if (origin && adminOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Admin origin not allowed'));
    }
  },
};
