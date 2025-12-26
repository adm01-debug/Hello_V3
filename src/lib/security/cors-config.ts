export interface CORSConfig {
  origin: string[] | string;
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge: number;
  preflightContinue?: boolean;
}

const ALLOWED_ORIGINS = {
  production: [
    'https://hello.app',
    'https://www.hello.app',
    'https://api.hello.app',
  ],
  staging: [
    'https://staging.hello.app',
    'https://staging-api.hello.app',
  ],
  development: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
  ],
};

export const CORS_CONFIG: CORSConfig = {
  origin: (origin, callback) => {
    const env = process.env.NODE_ENV || 'development';
    const allowedOrigins = [
      ...ALLOWED_ORIGINS.production,
      ...(env === 'staging' ? ALLOWED_ORIGINS.staging : []),
      ...(env === 'development' ? ALLOWED_ORIGINS.development : []),
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
    'X-CSRF-Token',
    'Accept',
    'Accept-Version',
    'Content-Length',
    'Content-MD5',
    'Date',
    'X-Api-Version',
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Number',
    'X-Page-Size',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
};

export function validateOrigin(origin: string): boolean {
  const env = process.env.NODE_ENV || 'development';
  const allowedOrigins = [
    ...ALLOWED_ORIGINS.production,
    ...(env === 'staging' ? ALLOWED_ORIGINS.staging : []),
    ...(env === 'development' ? ALLOWED_ORIGINS.development : []),
  ];
  
  return allowedOrigins.includes(origin);
}

export function configureCORS(app: any) {
  const cors = require('cors');
  
  // Global CORS
  app.use(cors(CORS_CONFIG));
  
  // Preflight requests
  app.options('*', cors(CORS_CONFIG));
  
  // Custom CORS for specific routes
  app.use('/api/public', cors({
    ...CORS_CONFIG,
    credentials: false, // Public API doesn't need credentials
  }));
  
  // Strict CORS for admin routes
  app.use('/api/admin', cors({
    ...CORS_CONFIG,
    origin: ALLOWED_ORIGINS.production,
  }));
}
