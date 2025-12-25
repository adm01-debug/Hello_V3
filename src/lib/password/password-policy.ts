/**
 * Password Policy Configuration
 * Defines rules for strong password requirements
 */

export const PASSWORD_POLICY = {
  // Minimum password length
  minLength: 12,

  // Maximum password length
  maxLength: 128,

  // Require at least one uppercase letter
  requireUppercase: true,

  // Require at least one lowercase letter
  requireLowercase: true,

  // Require at least one number
  requireNumbers: true,

  // Require at least one special character
  requireSpecialChars: true,

  // Special characters allowed
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',

  // Minimum strength score (0-4, using zxcvbn)
  minStrength: 3,

  // Prevent password reuse (last N passwords)
  preventReuse: 5,

  // Password expiration in days
  expirationDays: 90,

  // Warning before expiration (days)
  expirationWarningDays: 14,

  // Maximum failed login attempts before lockout
  maxFailedAttempts: 5,

  // Lockout duration in minutes
  lockoutDuration: 30,

  // Enable CAPTCHA after N failed attempts
  enableCaptchaAfter: 3,

  // Common passwords blocklist (top 10000 most common)
  blockCommonPasswords: true,

  // Block passwords containing username
  blockUsernameInPassword: true,

  // Block sequential characters (123, abc)
  blockSequential: true,

  // Block repeated characters (aaa, 111)
  blockRepeated: true,

  // Minimum unique characters
  minUniqueChars: 8,
} as const

export type PasswordPolicy = typeof PASSWORD_POLICY

/**
 * Password strength levels
 */
export enum PasswordStrength {
  VERY_WEAK = 0,
  WEAK = 1,
  FAIR = 2,
  STRONG = 3,
  VERY_STRONG = 4,
}

/**
 * Password strength labels
 */
export const PASSWORD_STRENGTH_LABELS: Record<PasswordStrength, string> = {
  [PasswordStrength.VERY_WEAK]: 'Muito Fraca',
  [PasswordStrength.WEAK]: 'Fraca',
  [PasswordStrength.FAIR]: 'Razoável',
  [PasswordStrength.STRONG]: 'Forte',
  [PasswordStrength.VERY_STRONG]: 'Muito Forte',
}

/**
 * Password strength colors
 */
export const PASSWORD_STRENGTH_COLORS: Record<PasswordStrength, string> = {
  [PasswordStrength.VERY_WEAK]: '#ef4444', // red-500
  [PasswordStrength.WEAK]: '#f97316', // orange-500
  [PasswordStrength.FAIR]: '#eab308', // yellow-500
  [PasswordStrength.STRONG]: '#22c55e', // green-500
  [PasswordStrength.VERY_STRONG]: '#10b981', // emerald-500
}
