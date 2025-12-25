/**
 * HTTPS Enforcement
 * Forces all traffic to use HTTPS in production
 */

export interface HTTPSConfig {
  enabled: boolean
  trustProxyHeaders: boolean
  permanentRedirect: boolean
  includeSubdomains: boolean
}

const DEFAULT_CONFIG: HTTPSConfig = {
  enabled: process.env.NODE_ENV === 'production',
  trustProxyHeaders: true,
  permanentRedirect: true,
  includeSubdomains: true,
}

/**
 * Enforce HTTPS middleware
 */
export function enforceHTTPS(config: Partial<HTTPSConfig> = {}) {
  const opts = { ...DEFAULT_CONFIG, ...config }

  return function (req: any, res: any, next: any) {
    // Skip in development
    if (!opts.enabled) {
      return next()
    }

    // Check if request is already HTTPS
    const isHTTPS = opts.trustProxyHeaders
      ? req.headers['x-forwarded-proto'] === 'https' || req.secure
      : req.secure

    if (isHTTPS) {
      return next()
    }

    // Redirect to HTTPS
    const host = req.headers.host || req.hostname
    const url = `https://${host}${req.url}`

    const statusCode = opts.permanentRedirect ? 301 : 302

    return res.redirect(statusCode, url)
  }
}

/**
 * Check if request is HTTPS
 */
export function isHTTPS(req: any): boolean {
  return (
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    req.headers['x-forwarded-ssl'] === 'on'
  )
}

/**
 * Get protocol from request
 */
export function getProtocol(req: any): 'http' | 'https' {
  return isHTTPS(req) ? 'https' : 'http'
}

/**
 * Build absolute URL with HTTPS
 */
export function buildSecureURL(path: string, host?: string): string {
  const baseHost = host || window.location.host
  return `https://${baseHost}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Ensure URL uses HTTPS
 */
export function ensureHTTPS(url: string): string {
  if (!url) return url

  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'http:') {
      parsed.protocol = 'https:'
    }
    return parsed.toString()
  } catch {
    // If not a valid URL, return as-is
    return url
  }
}
