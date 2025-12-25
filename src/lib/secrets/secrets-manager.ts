/**
 * Secrets Manager
 * Secure management of application secrets and API keys
 */

export interface Secret {
  key: string
  value: string
  encrypted: boolean
  createdAt: Date
  expiresAt?: Date
}

/**
 * Secrets Manager Class
 */
export class SecretsManager {
  private static secrets: Map<string, Secret> = new Map()
  private static initialized = false

  /**
   * Initialize secrets from environment
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return

    // Load from environment variables
    this.loadFromEnvironment()

    this.initialized = true
  }

  /**
   * Load secrets from environment variables
   */
  private static loadFromEnvironment(): void {
    const secretKeys = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_PUBLISHABLE_KEY',
      'VITE_API_KEY',
      'VITE_SENTRY_DSN',
    ]

    secretKeys.forEach((key) => {
      const value = import.meta.env[key]
      if (value) {
        this.secrets.set(key, {
          key,
          value,
          encrypted: false,
          createdAt: new Date(),
        })
      }
    })
  }

  /**
   * Get secret by key
   */
  static get(key: string): string {
    if (!this.initialized) {
      throw new Error('SecretsManager not initialized. Call initialize() first.')
    }

    const secret = this.secrets.get(key)
    if (!secret) {
      throw new Error(`Secret not found: ${key}`)
    }

    // Check expiration
    if (secret.expiresAt && secret.expiresAt < new Date()) {
      throw new Error(`Secret expired: ${key}`)
    }

    return secret.value
  }

  /**
   * Get secret safely (returns null if not found)
   */
  static getSafe(key: string): string | null {
    try {
      return this.get(key)
    } catch {
      return null
    }
  }

  /**
   * Set secret
   */
  static set(
    key: string,
    value: string,
    options: { encrypted?: boolean; expiresAt?: Date } = {}
  ): void {
    this.secrets.set(key, {
      key,
      value,
      encrypted: options.encrypted || false,
      createdAt: new Date(),
      expiresAt: options.expiresAt,
    })
  }

  /**
   * Check if secret exists
   */
  static has(key: string): boolean {
    return this.secrets.has(key)
  }

  /**
   * Delete secret
   */
  static delete(key: string): boolean {
    return this.secrets.delete(key)
  }

  /**
   * Clear all secrets
   */
  static clear(): void {
    this.secrets.clear()
    this.initialized = false
  }

  /**
   * Get all secret keys (not values!)
   */
  static getKeys(): string[] {
    return Array.from(this.secrets.keys())
  }

  /**
   * Rotate secret (update with new value)
   */
  static rotate(key: string, newValue: string): void {
    const existing = this.secrets.get(key)
    if (!existing) {
      throw new Error(`Cannot rotate non-existent secret: ${key}`)
    }

    this.set(key, newValue, {
      encrypted: existing.encrypted,
      expiresAt: existing.expiresAt,
    })

    console.log(`[SECRETS] Secret rotated: ${key}`)
  }

  /**
   * Validate required secrets
   */
  static validateRequired(requiredKeys: string[]): void {
    const missing: string[] = []

    requiredKeys.forEach((key) => {
      if (!this.has(key)) {
        missing.push(key)
      }
    })

    if (missing.length > 0) {
      throw new Error(
        `Missing required secrets: ${missing.join(', ')}\n` +
        'Please check your .env file.'
      )
    }
  }

  /**
   * Mask secret for logging (show only first/last chars)
   */
  static maskSecret(value: string, showChars: number = 4): string {
    if (value.length <= showChars * 2) {
      return '*'.repeat(value.length)
    }

    const start = value.substring(0, showChars)
    const end = value.substring(value.length - showChars)
    const middle = '*'.repeat(value.length - showChars * 2)

    return `${start}${middle}${end}`
  }

  /**
   * Get secret info for debugging (without exposing value)
   */
  static getSecretInfo(key: string): Omit<Secret, 'value'> | null {
    const secret = this.secrets.get(key)
    if (!secret) return null

    return {
      key: secret.key,
      encrypted: secret.encrypted,
      createdAt: secret.createdAt,
      expiresAt: secret.expiresAt,
    }
  }
}

// Initialize on module load
SecretsManager.initialize()
