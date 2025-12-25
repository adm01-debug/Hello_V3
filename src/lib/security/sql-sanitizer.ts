/**
 * SQL Sanitizer - SQL Injection Prevention
 * Comprehensive SQL injection attack prevention
 */

export class SQLSanitizer {
  /**
   * SQL keywords that indicate potential injection
   */
  private static readonly SQL_KEYWORDS = [
    'SELECT',
    'INSERT',
    'UPDATE',
    'DELETE',
    'DROP',
    'CREATE',
    'ALTER',
    'EXEC',
    'EXECUTE',
    'UNION',
    'TRUNCATE',
    'GRANT',
    'REVOKE',
  ]

  /**
   * SQL operators and special characters
   */
  private static readonly SQL_OPERATORS = [
    '--',
    ';',
    '/*',
    '*/',
    'xp_',
    'sp_',
    '@@',
  ]

  /**
   * Detect SQL injection patterns
   */
  static detectSQLInjection(input: string): boolean {
    if (!input) return false

    const upperInput = input.toUpperCase()

    // Check for SQL keywords
    const hasKeywords = this.SQL_KEYWORDS.some((keyword) =>
      upperInput.includes(keyword)
    )

    // Check for SQL operators
    const hasOperators = this.SQL_OPERATORS.some((op) => input.includes(op))

    // Check for common injection patterns
    const injectionPatterns = [
      /(\bOR\b\s+\d+\s*=\s*\d+)/i,
      /(\bAND\b\s+\d+\s*=\s*\d+)/i,
      /([\';])\s*OR\s+['"]/i,
      /([\';])\s*AND\s+['"]/i,
      /UNION\s+SELECT/i,
      /INTO\s+OUTFILE/i,
      /LOAD_FILE/i,
    ]

    const hasPatterns = injectionPatterns.some((pattern) => pattern.test(input))

    return hasKeywords || hasOperators || hasPatterns
  }

  /**
   * Remove SQL injection attempts
   */
  static removeSQLInjection(input: string): string {
    if (!input) return ''

    let sanitized = input

    // Remove SQL comments
    sanitized = sanitized.replace(/--[^\n]*/g, '')
    sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, '')

    // Remove semicolons (statement terminators)
    sanitized = sanitized.replace(/;/g, '')

    // Remove dangerous SQL keywords in specific contexts
    const dangerousPatterns = [
      /\bOR\b\s+\d+\s*=\s*\d+/gi,
      /\bAND\b\s+\d+\s*=\s*\d+/gi,
      /\bUNION\b\s+\bSELECT\b/gi,
      /\bEXEC\b\s*\(/gi,
      /\bEXECUTE\b\s*\(/gi,
    ]

    dangerousPatterns.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, '')
    })

    return sanitized.trim()
  }

  /**
   * Escape single quotes for SQL
   */
  static escapeSingleQuotes(input: string): string {
    if (!input) return ''
    return input.replace(/'/g, "''")
  }

  /**
   * Validate parameter for SQL use
   */
  static validateSQLParameter(
    value: any,
    type: 'string' | 'number' | 'boolean' | 'date'
  ): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string' && !this.detectSQLInjection(value)
      case 'number':
        return typeof value === 'number' && !isNaN(value)
      case 'boolean':
        return typeof value === 'boolean'
      case 'date':
        return value instanceof Date && !isNaN(value.getTime())
      default:
        return false
    }
  }

  /**
   * Safe parameterized query builder
   * Use with Supabase or any parameterized query system
   */
  static buildSafeQuery(
    template: string,
    params: Record<string, any>
  ): { query: string; params: Record<string, any> } {
    const sanitizedParams: Record<string, any> = {}

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        // Remove SQL injection attempts
        sanitizedParams[key] = this.removeSQLInjection(value)
      } else {
        sanitizedParams[key] = value
      }
    }

    return {
      query: template,
      params: sanitizedParams,
    }
  }

  /**
   * Whitelist validation for table and column names
   */
  static validateIdentifier(identifier: string, whitelist: string[]): boolean {
    if (!identifier) return false

    // Must be in whitelist
    if (!whitelist.includes(identifier)) return false

    // Must be alphanumeric with underscores
    const validPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/
    return validPattern.test(identifier)
  }
}
