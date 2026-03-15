/**
 * Content Security Policy (CSP) configuration utility.
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
  formAction: string[];
  baseUri: string[];
}

export const DEFAULT_CSP_DIRECTIVES: CSPDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'"],
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  imgSrc: ["'self'", "data:", "https:", "blob:"],
  connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co"],
  fontSrc: ["'self'", "https://fonts.gstatic.com"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'", "blob:"],
  frameSrc: ["'none'"],
  workerSrc: ["'self'", "blob:"],
  formAction: ["'self'"],
  baseUri: ["'self'"],
};

export function buildCSPHeader(directives: Partial<CSPDirectives> = {}): string {
  const merged = { ...DEFAULT_CSP_DIRECTIVES, ...directives };
  const parts: string[] = [];

  const directiveMap: Record<string, keyof CSPDirectives> = {
    "default-src": "defaultSrc",
    "script-src": "scriptSrc",
    "style-src": "styleSrc",
    "img-src": "imgSrc",
    "connect-src": "connectSrc",
    "font-src": "fontSrc",
    "object-src": "objectSrc",
    "media-src": "mediaSrc",
    "frame-src": "frameSrc",
    "worker-src": "workerSrc",
    "form-action": "formAction",
    "base-uri": "baseUri",
  };

  for (const [header, key] of Object.entries(directiveMap)) {
    if (merged[key]?.length) {
      parts.push(`${header} ${merged[key].join(" ")}`);
    }
  }

  return parts.join("; ");
}
