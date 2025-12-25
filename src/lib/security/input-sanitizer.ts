import DOMPurify from 'dompurify'
import validator from 'validator'

/**
 * Input Sanitizer - Global XSS and SQL Injection Prevention
 * Sanitizes all user inputs to prevent security vulnerabilities
 */
export class InputSanitizer {
  /**
   * Sanitize HTML content using DOMPurify
   * Removes malicious scripts, iframes, and dangerous tags
   */
  static sanitizeHTML(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href', 'title'],
    })
  }

  /**
   * Sanitize plain text string
   * Escapes HTML entities and removes control characters
   */
  static sanitizeString(input: string): string {
    if (!input) return ''
    return validator.escape(input.trim())
  }

  /**
   * Sanitize email address
   * Normalizes and validates email format
   */
  static sanitizeEmail(email: string): string {
    if (!email) return ''
    const normalized = validator.normalizeEmail(email)
    return normalized && validator.isEmail(normalized) ? normalized : ''
  }

  /**
   * Sanitize phone number
   * Removes all non-numeric characters except +
   */
  static sanitizePhone(phone: string): string {
    if (!phone) return ''
    return phone.replace(/[^0-9+]/g, '')
  }

  /**
   * Sanitize URL
   * Validates and normalizes URL format
   */
  static sanitizeURL(url: string): string {
    if (!url) return ''
    try {
      const normalized = validator.trim(url)
      return validator.isURL(normalized, {
        protocols: ['http', 'https'],
        require_protocol: true,
      })
        ? normalized
        : ''
    } catch {
      return ''
    }
  }

  /**
   * Sanitize number input
   * Ensures value is a valid number
   */
  static sanitizeNumber(input: string | number): number {
    const num = typeof input === 'string' ? parseFloat(input) : input
    return isNaN(num) ? 0 : num
  }

  /**
   * Sanitize object recursively
   * Applies sanitization to all string values in an object
   */
  static sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const sanitized = { ...obj }

    for (const key in sanitized) {
      const value = sanitized[key]

      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value) as any
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value)
      }
    }

    return sanitized
  }

  /**
   * Remove SQL injection patterns
   */
  static removeSQLInjection(input: string): string {
    if (!input) return ''

    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
      /(--|;|\/\*|\*\/)/g,
      /(\bOR\b\s+\d+\s*=\s*\d+)/gi,
      /(\bAND\b\s+\d+\s*=\s*\d+)/gi,
    ]

    let sanitized = input
    sqlPatterns.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, '')
    })

    return sanitized.trim()
  }

  /**
   * Sanitize file name
   * Removes path traversal and dangerous characters
   */
  static sanitizeFileName(fileName: string): string {
    if (!fileName) return ''

    return fileName
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove dangerous chars
      .replace(/^\.+/, '') // Remove leading dots
      .replace(/\.{2,}/g, '.') // Replace multiple dots
      .trim()
      .substring(0, 255) // Limit length
  }
}
