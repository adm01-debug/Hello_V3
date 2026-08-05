/**
 * Security headers configuration (Helmet-like for SPAs).
 */

export interface SecurityHeaders {
  "X-Content-Type-Options": string;
  "X-Frame-Options": string;
  "X-XSS-Protection": string;
  "Referrer-Policy": string;
  "Permissions-Policy": string;
  "X-DNS-Prefetch-Control": string;
  "X-Download-Options": string;
  "X-Permitted-Cross-Domain-Policies": string;
}

export const DEFAULT_SECURITY_HEADERS: SecurityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "0",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(self), geolocation=(), payment=()",
  "X-DNS-Prefetch-Control": "off",
  "X-Download-Options": "noopen",
  "X-Permitted-Cross-Domain-Policies": "none",
};

export function getSecurityHeaders(overrides: Partial<SecurityHeaders> = {}): SecurityHeaders {
  return { ...DEFAULT_SECURITY_HEADERS, ...overrides };
}

export function applyMetaTags(headers: Partial<SecurityHeaders> = {}): void {
  const merged = getSecurityHeaders(headers);
  
  const existingMetas = document.querySelectorAll('meta[http-equiv]');
  const existingNames = new Set(Array.from(existingMetas).map(m => m.getAttribute('http-equiv')));

  for (const [name, value] of Object.entries(merged)) {
    if (!existingNames.has(name)) {
      const meta = document.createElement("meta");
      meta.httpEquiv = name;
      meta.content = value;
      document.head.appendChild(meta);
    }
  }
}
