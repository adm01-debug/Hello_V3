import zxcvbn from 'zxcvbn'
import { PASSWORD_POLICY, PasswordStrength } from './password-policy'

/**
 * Password Validation Result
 */
export interface PasswordValidationResult {
  valid: boolean
  strength: PasswordStrength
  score: number
  errors: string[]
  warnings: string[]
  suggestions: string[]
  estimatedCrackTime: string
}

/**
 * Password Validator
 * Comprehensive password validation using zxcvbn and custom rules
 */
export class PasswordValidator {
  /**
   * Validate password against all policy rules
   */
  static validate(
    password: string,
    username?: string,
    email?: string
  ): PasswordValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    // Run zxcvbn analysis
    const userInputs = [username, email].filter(Boolean) as string[]
    const analysis = zxcvbn(password, userInputs)

    // Check minimum length
    if (password.length < PASSWORD_POLICY.minLength) {
      errors.push(
        `A senha deve ter no mínimo ${PASSWORD_POLICY.minLength} caracteres`
      )
    }

    // Check maximum length
    if (password.length > PASSWORD_POLICY.maxLength) {
      errors.push(
        `A senha deve ter no máximo ${PASSWORD_POLICY.maxLength} caracteres`
      )
    }

    // Check uppercase requirement
    if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra maiúscula')
    }

    // Check lowercase requirement
    if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra minúscula')
    }

    // Check numbers requirement
    if (PASSWORD_POLICY.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('A senha deve conter pelo menos um número')
    }

    // Check special characters requirement
    if (PASSWORD_POLICY.requireSpecialChars) {
      const specialCharsRegex = new RegExp(
        `[${PASSWORD_POLICY.specialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`
      )
      if (!specialCharsRegex.test(password)) {
        errors.push(
          `A senha deve conter pelo menos um caractere especial (${PASSWORD_POLICY.specialChars})`
        )
      }
    }

    // Check minimum strength
    if (analysis.score < PASSWORD_POLICY.minStrength) {
      errors.push('A senha é muito fraca. Tente uma combinação mais complexa.')
    }

    // Check username in password
    if (
      PASSWORD_POLICY.blockUsernameInPassword &&
      username &&
      password.toLowerCase().includes(username.toLowerCase())
    ) {
      errors.push('A senha não pode conter seu nome de usuário')
    }

    // Check for sequential characters
    if (PASSWORD_POLICY.blockSequential && this.hasSequentialChars(password)) {
      warnings.push('Evite usar caracteres sequenciais (ex: 123, abc)')
    }

    // Check for repeated characters
    if (PASSWORD_POLICY.blockRepeated && this.hasRepeatedChars(password)) {
      warnings.push('Evite usar muitos caracteres repetidos (ex: aaa, 111)')
    }

    // Check unique characters
    const uniqueChars = new Set(password).size
    if (uniqueChars < PASSWORD_POLICY.minUniqueChars) {
      errors.push(
        `A senha deve ter pelo menos ${PASSWORD_POLICY.minUniqueChars} caracteres únicos`
      )
    }

    // Add zxcvbn suggestions
    if (analysis.feedback.suggestions) {
      suggestions.push(...analysis.feedback.suggestions)
    }

    // Add zxcvbn warning
    if (analysis.feedback.warning) {
      warnings.push(analysis.feedback.warning)
    }

    return {
      valid: errors.length === 0,
      strength: analysis.score as PasswordStrength,
      score: analysis.score,
      errors,
      warnings,
      suggestions,
      estimatedCrackTime: this.formatCrackTime(analysis.crack_times_display.offline_slow_hashing_1e4_per_second),
    }
  }

  /**
   * Check for sequential characters
   */
  private static hasSequentialChars(password: string): boolean {
    const sequences = [
      '0123456789',
      'abcdefghijklmnopqrstuvwxyz',
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm',
    ]

    for (const seq of sequences) {
      for (let i = 0; i <= seq.length - 3; i++) {
        const substring = seq.substring(i, i + 3)
        if (password.toLowerCase().includes(substring)) {
          return true
        }
        // Check reverse
        if (password.toLowerCase().includes([...substring].reverse().join(''))) {
          return true
        }
      }
    }

    return false
  }

  /**
   * Check for repeated characters
   */
  private static hasRepeatedChars(password: string): boolean {
    // Check for 3 or more repeated characters
    const repeatedPattern = /(.)\1{2,}/
    return repeatedPattern.test(password)
  }

  /**
   * Format crack time for display
   */
  private static formatCrackTime(crackTime: string): string {
    return crackTime
      .replace('less than a second', 'menos de 1 segundo')
      .replace('seconds', 'segundos')
      .replace('minutes', 'minutos')
      .replace('hours', 'horas')
      .replace('days', 'dias')
      .replace('months', 'meses')
      .replace('years', 'anos')
      .replace('centuries', 'séculos')
  }

  /**
   * Calculate password strength percentage
   */
  static getStrengthPercentage(score: number): number {
    return (score / 4) * 100
  }
}
