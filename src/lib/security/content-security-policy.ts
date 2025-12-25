/**
 * Content Security Policy (CSP) Configuration
 * Prevents XSS attacks by controlling which resources can be loaded
 */

export interface CSPDirectives {
  defaultSrc: string[];
  scriptSrc: string[];
  styleSrc: string[];
  imgSrc: string[];
  connectSrc: string[];
  fontSrc: string[];
  objectSrc: string[];
  mediaSrc: string[];
  frameSrc: string[];
  workerSrc: string[];
  childSrc: string[];
  formAction: string[];
  frameAncestors: string[];
  baseUri: string[];
  manifestSrc: string[];
}

export const CSP_DIRECTIVES: CSPDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  imgSrc: ["'self'", "data:", "https:", "blob:"],
  connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co"],
  fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'", "blob:"],
  frameSrc: ["'self'"],
  workerSrc: ["'self'", "blob:"],
  childSrc: ["'self'", "blob:"],
  formAction: ["'self'"],
  frameAncestors: ["'none'"],
  baseUri: ["'self'"],
  manifestSrc: ["'self'"],
};

export function generateCSPHeader(directives: CSPDirectives = CSP_DIRECTIVES): string {
  return Object.entries(directives)
    .map(([key, values]) => {
      const directive = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${directive} ${values.join(' ')}`;
    })
    .join('; ');
}

export function applyCSP(response: Response): Response {
  const cspHeader = generateCSPHeader();
  response.headers.set('Content-Security-Policy', cspHeader);
  return response;
}

export const cspMiddleware = () => {
  return (req: Request, res: Response, next: Function) => {
    res.setHeader('Content-Security-Policy', generateCSPHeader());
    next();
  };
};
