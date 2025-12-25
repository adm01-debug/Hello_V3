/**
 * HSTS (HTTP Strict Transport Security) Headers
 * Forces browsers to only connect via HTTPS
 */

export interface HSTSConfig {
  maxAge: number
  includeSubDomains: boolean
  preload: boolean
}

const DEFAULT_HSTS_CONFIG: HSTSConfig = {
  // 1 year in seconds
  maxAge: 31536000,
  // Include all subdomains
  includeSubDomains: true,
  // Enable preloading (requires manual submission to browsers)
  preload: true,
}

/**
 * Get HSTS header value
 */
export function getHSTSHeader(config: Partial<HSTSConfig> = {}): string {
  const opts = { ...DEFAULT_HSTS_CONFIG, ...config }

  const directives = [`max-age=${opts.maxAge}`]

  if (opts.includeSubDomains) {
    directives.push('includeSubDomains')
  }

  if (opts.preload) {
    directives.push('preload')
  }

  return directives.join('; ')
}

/**
 * HSTS middleware
 */
export function hstsMiddleware(config: Partial<HSTSConfig> = {}) {
  const headerValue = getHSTSHeader(config)

  return function (req: any, res: any, next: any) {
    // Only set HSTS on HTTPS connections
    const isHTTPS =
      req.secure ||
      req.headers['x-forwarded-proto'] === 'https' ||
      req.headers['x-forwarded-ssl'] === 'on'

    if (isHTTPS && process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', headerValue)
    }

    next()
  }
}

/**
 * Complete HTTPS security headers
 */
export const HTTPS_SECURITY_HEADERS = {
  // HSTS
  'Strict-Transport-Security': getHSTSHeader(),

  // Force HTTPS for forms
  'Content-Security-Policy': 'upgrade-insecure-requests',

  // Prevent loading over HTTP in iframes
  'X-Frame-Options': 'SAMEORIGIN',

  // Don't send referrer on HTTP
  'Referrer-Policy': 'strict-origin-when-cross-origin',
} as const

/**
 * Apply all HTTPS security headers
 */
export function applyHTTPSSecurityHeaders(res: any): void {
  Object.entries(HTTPS_SECURITY_HEADERS).forEach(([header, value]) => {
    res.setHeader(header, value)
  })
}

/**
 * Middleware to apply all HTTPS security headers
 */
export function httpsSecurityHeadersMiddleware() {
  return function (req: any, res: any, next: any) {
    const isHTTPS =
      req.secure ||
      req.headers['x-forwarded-proto'] === 'https' ||
      req.headers['x-forwarded-ssl'] === 'on'

    if (isHTTPS && process.env.NODE_ENV === 'production') {
      applyHTTPSSecurityHeaders(res)
    }

    next()
  }
}
