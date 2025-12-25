import { RedisCache } from './redis-client'

export class CacheInvalidator {
  static async invalidateUser(userId: string): Promise<void> {
    await RedisCache.invalidatePattern(`user:${userId}:*`)
  }

  static async invalidateCall(callId: string): Promise<void> {
    await RedisCache.invalidatePattern(`call:${callId}:*`)
  }

  static async invalidateAll(): Promise<void> {
    await RedisCache.invalidatePattern('*')
  }
}
