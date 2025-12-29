import helmet from 'helmet';

export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Remove in production with nonce
        'https://cdn.hello.app',
        'https://www.googletagmanager.com',
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for styled-components
        'https://fonts.googleapis.com',
      ],
      fontSrc: [
        "'self'",
        'https://fonts.gstatic.com',
      ],
      imgSrc: [
        "'self'",
        'data:',
        'https:',
        'blob:',
      ],
      connectSrc: [
        "'self'",
        'https://api.hello.app',
        'https://*.supabase.co',
        'wss://*.supabase.co',
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      workerSrc: ["'self'", 'blob:'],
      childSrc: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      manifestSrc: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: { policy: 'require-corp' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

// Development-friendly helmet (less restrictive CSP)
export const helmetDevConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:', 'http:'],
      connectSrc: ["'self'", 'ws:', 'wss:', 'http:', 'https:'],
    },
  },
  hsts: false,
});

// Export appropriate config based on environment
export default process.env.NODE_ENV === 'production' 
  ? helmetConfig 
  : helmetDevConfig;
