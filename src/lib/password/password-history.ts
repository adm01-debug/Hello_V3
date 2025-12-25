import bcrypt from 'bcryptjs'
import { PASSWORD_POLICY } from './password-policy'

/**
 * Password History Entry
 */
export interface PasswordHistoryEntry {
  id: string
  userId: string
  passwordHash: string
  createdAt: Date
}

/**
 * Password History Service
 * Prevents password reuse and tracks password changes
 */
export class PasswordHistory {
  /**
   * Check if password was used recently
   */
  static async wasPasswordUsedRecently(
    userId: string,
    newPassword: string,
    previousPasswords: PasswordHistoryEntry[]
  ): Promise<boolean> {
    // Get last N passwords according to policy
    const recentPasswords = previousPasswords
      .slice(0, PASSWORD_POLICY.preventReuse)

    // Check against each previous password
    for (const entry of recentPasswords) {
      const isMatch = await bcrypt.compare(newPassword, entry.passwordHash)
      if (isMatch) {
        return true
      }
    }

    return false
  }

  /**
   * Add password to history
   */
  static async addToHistory(
    userId: string,
    passwordHash: string
  ): Promise<PasswordHistoryEntry> {
    const entry: PasswordHistoryEntry = {
      id: crypto.randomUUID(),
      userId,
      passwordHash,
      createdAt: new Date(),
    }

    // In real implementation, save to database
    // await supabase.from('password_history').insert(entry)

    return entry
  }

  /**
   * Get password history for user
   */
  static async getPasswordHistory(
    userId: string,
    limit: number = PASSWORD_POLICY.preventReuse
  ): Promise<PasswordHistoryEntry[]> {
    // In real implementation, fetch from database
    // const { data } = await supabase
    //   .from('password_history')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .order('created_at', { ascending: false })
    //   .limit(limit)

    // Mock implementation
    return []
  }

  /**
   * Clean old password history
   * Keep only the required number of entries per policy
   */
  static async cleanOldHistory(userId: string): Promise<void> {
    // In real implementation:
    // const allPasswords = await this.getPasswordHistory(userId, 1000)
    // const toDelete = allPasswords.slice(PASSWORD_POLICY.preventReuse)
    
    // if (toDelete.length > 0) {
    //   const ids = toDelete.map(p => p.id)
    //   await supabase.from('password_history').delete().in('id', ids)
    // }
  }

  /**
   * Check if password needs to be changed (expiration)
   */
  static isPasswordExpired(lastChangedAt: Date): boolean {
    const now = new Date()
    const daysSinceChange =
      (now.getTime() - lastChangedAt.getTime()) / (1000 * 60 * 60 * 24)

    return daysSinceChange >= PASSWORD_POLICY.expirationDays
  }

  /**
   * Check if password expiration warning should be shown
   */
  static shouldShowExpirationWarning(lastChangedAt: Date): boolean {
    const now = new Date()
    const daysSinceChange =
      (now.getTime() - lastChangedAt.getTime()) / (1000 * 60 * 60 * 24)

    const daysUntilExpiration = PASSWORD_POLICY.expirationDays - daysSinceChange

    return (
      daysUntilExpiration > 0 &&
      daysUntilExpiration <= PASSWORD_POLICY.expirationWarningDays
    )
  }

  /**
   * Get days until password expiration
   */
  static getDaysUntilExpiration(lastChangedAt: Date): number {
    const now = new Date()
    const daysSinceChange =
      (now.getTime() - lastChangedAt.getTime()) / (1000 * 60 * 60 * 24)

    return Math.max(0, PASSWORD_POLICY.expirationDays - daysSinceChange)
  }
}
