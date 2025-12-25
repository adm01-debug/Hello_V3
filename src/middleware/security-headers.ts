export const SECURITY_HEADERS = {
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
}

export function securityHeadersMiddleware() {
  return (req: any, res: any, next: any) => {
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      res.setHeader(key, value)
    })
    next()
  }
}
