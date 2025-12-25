/**
 * XSS Prevention - Cross-Site Scripting Protection
 * Comprehensive XSS attack prevention utilities
 */

export class XSSPrevention {
  /**
   * List of dangerous HTML tags that should always be removed
   */
  private static readonly DANGEROUS_TAGS = [
    'script',
    'iframe',
    'object',
    'embed',
    'applet',
    'meta',
    'link',
    'style',
    'base',
  ]

  /**
   * List of dangerous event attributes
   */
  private static readonly DANGEROUS_ATTRIBUTES = [
    'onerror',
    'onload',
    'onclick',
    'onmouseover',
    'onfocus',
    'onblur',
    'onchange',
    'onsubmit',
  ]

  /**
   * Strip all HTML tags from input
   */
  static stripHTML(input: string): string {
    if (!input) return ''
    return input.replace(/<[^>]*>/g, '')
  }

  /**
   * Encode HTML entities
   */
  static encodeHTML(input: string): string {
    if (!input) return ''

    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    }

    return input.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char)
  }

  /**
   * Decode HTML entities
   */
  static decodeHTML(input: string): string {
    if (!input) return ''

    const textarea = document.createElement('textarea')
    textarea.innerHTML = input
    return textarea.value
  }

  /**
   * Remove dangerous tags
   */
  static removeDangerousTags(html: string): string {
    if (!html) return ''

    let cleaned = html
    this.DANGEROUS_TAGS.forEach((tag) => {
      const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gis')
      cleaned = cleaned.replace(regex, '')
      const selfClosing = new RegExp(`<${tag}[^>]*/>`, 'gi')
      cleaned = cleaned.replace(selfClosing, '')
    })

    return cleaned
  }

  /**
   * Remove event handlers from HTML
   */
  static removeEventHandlers(html: string): string {
    if (!html) return ''

    let cleaned = html
    this.DANGEROUS_ATTRIBUTES.forEach((attr) => {
      const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi')
      cleaned = cleaned.replace(regex, '')
    })

    return cleaned
  }

  /**
   * Detect potential XSS patterns
   */
  static detectXSS(input: string): boolean {
    if (!input) return false

    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gis,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /eval\(/gi,
      /expression\(/gi,
    ]

    return xssPatterns.some((pattern) => pattern.test(input))
  }

  /**
   * Safe JSON parse with XSS prevention
   */
  static safeJSONParse<T = any>(jsonString: string): T | null {
    try {
      const sanitized = this.encodeHTML(jsonString)
      return JSON.parse(sanitized)
    } catch {
      return null
    }
  }

  /**
   * Validate and sanitize URLs to prevent XSS via data: or javascript: protocols
   */
  static sanitizeURL(url: string): string {
    if (!url) return ''

    const trimmed = url.trim().toLowerCase()

    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:']
    if (dangerousProtocols.some((protocol) => trimmed.startsWith(protocol))) {
      return ''
    }

    // Only allow http, https, mailto
    const allowedProtocols = ['http://', 'https://', 'mailto:', '/', '#']
    const isAllowed = allowedProtocols.some((protocol) =>
      trimmed.startsWith(protocol)
    )

    return isAllowed ? url.trim() : ''
  }
}
