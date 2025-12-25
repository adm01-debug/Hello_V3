import { InputSanitizer } from './input-sanitizer'
import { XSSPrevention } from './xss-prevention'
import { SQLSanitizer } from './sql-sanitizer'

/**
 * Sanitization Middleware
 * Automatically sanitizes all incoming requests
 */

export interface SanitizationOptions {
  sanitizeBody?: boolean
  sanitizeQuery?: boolean
  sanitizeParams?: boolean
  removeXSS?: boolean
  removeSQL?: boolean
  logViolations?: boolean
}

const DEFAULT_OPTIONS: SanitizationOptions = {
  sanitizeBody: true,
  sanitizeQuery: true,
  sanitizeParams: true,
  removeXSS: true,
  removeSQL: true,
  logViolations: true,
}

/**
 * Sanitize all request data
 */
export function sanitizeMiddleware(options: SanitizationOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  return function (req: any, res: any, next: any) {
    const violations: string[] = []

    // Sanitize request body
    if (opts.sanitizeBody && req.body) {
      req.body = sanitizeData(req.body, violations, opts)
    }

    // Sanitize query parameters
    if (opts.sanitizeQuery && req.query) {
      req.query = sanitizeData(req.query, violations, opts)
    }

    // Sanitize URL parameters
    if (opts.sanitizeParams && req.params) {
      req.params = sanitizeData(req.params, violations, opts)
    }

    // Log violations if enabled
    if (opts.logViolations && violations.length > 0) {
      console.warn('[SECURITY] Sanitization violations detected:', {
        url: req.url,
        method: req.method,
        violations,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      })
    }

    next()
  }
}

/**
 * Recursively sanitize data object
 */
function sanitizeData(
  data: any,
  violations: string[],
  options: SanitizationOptions
): any {
  if (data === null || data === undefined) {
    return data
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, violations, options))
  }

  // Handle objects
  if (typeof data === 'object') {
    const sanitized: any = {}

    for (const [key, value] of Object.entries(data)) {
      // Sanitize the key itself
      const sanitizedKey = InputSanitizer.sanitizeString(key)

      // Sanitize the value
      sanitized[sanitizedKey] = sanitizeData(value, violations, options)
    }

    return sanitized
  }

  // Handle strings
  if (typeof data === 'string') {
    let sanitized = data

    // Check for XSS
    if (options.removeXSS && XSSPrevention.detectXSS(sanitized)) {
      violations.push(`XSS detected: ${sanitized.substring(0, 50)}...`)
      sanitized = XSSPrevention.removeDangerousTags(sanitized)
      sanitized = XSSPrevention.removeEventHandlers(sanitized)
    }

    // Check for SQL injection
    if (options.removeSQL && SQLSanitizer.detectSQLInjection(sanitized)) {
      violations.push(`SQL injection detected: ${sanitized.substring(0, 50)}...`)
      sanitized = SQLSanitizer.removeSQLInjection(sanitized)
    }

    // General sanitization
    sanitized = InputSanitizer.sanitizeString(sanitized)

    return sanitized
  }

  // Return other types as-is
  return data
}

/**
 * React hook for client-side sanitization
 */
export function useSanitization() {
  const sanitizeInput = (input: string): string => {
    let sanitized = input

    // Remove XSS
    if (XSSPrevention.detectXSS(sanitized)) {
      sanitized = XSSPrevention.encodeHTML(sanitized)
    }

    // Remove SQL injection
    if (SQLSanitizer.detectSQLInjection(sanitized)) {
      sanitized = SQLSanitizer.removeSQLInjection(sanitized)
    }

    return InputSanitizer.sanitizeString(sanitized)
  }

  const sanitizeEmail = (email: string): string => {
    return InputSanitizer.sanitizeEmail(email)
  }

  const sanitizePhone = (phone: string): string => {
    return InputSanitizer.sanitizePhone(phone)
  }

  const sanitizeURL = (url: string): string => {
    return XSSPrevention.sanitizeURL(url)
  }

  const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
    return InputSanitizer.sanitizeObject(obj)
  }

  return {
    sanitizeInput,
    sanitizeEmail,
    sanitizePhone,
    sanitizeURL,
    sanitizeObject,
  }
}
