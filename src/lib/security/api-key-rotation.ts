/**
 * API Key Rotation Utility
 * Manages automatic rotation of API keys with configurable intervals.
 */

export interface ApiKeyConfig {
  keyId: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export const DEFAULT_ROTATION_INTERVAL_DAYS = 90;

export function isKeyExpired(config: ApiKeyConfig): boolean {
  return new Date() > config.expiresAt;
}

export function shouldRotateKey(config: ApiKeyConfig, warningDays = 7): boolean {
  const warningDate = new Date(config.expiresAt);
  warningDate.setDate(warningDate.getDate() - warningDays);
  return new Date() > warningDate;
}

export function generateRotationSchedule(
  currentKey: ApiKeyConfig,
  rotationIntervalDays = DEFAULT_ROTATION_INTERVAL_DAYS
): { nextRotation: Date; daysRemaining: number } {
  const nextRotation = new Date(currentKey.createdAt);
  nextRotation.setDate(nextRotation.getDate() + rotationIntervalDays);
  const daysRemaining = Math.max(
    0,
    Math.ceil((nextRotation.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );
  return { nextRotation, daysRemaining };
}

export function createKeyConfig(keyId: string, rotationDays = DEFAULT_ROTATION_INTERVAL_DAYS): ApiKeyConfig {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + rotationDays);
  return { keyId, createdAt: now, expiresAt, isActive: true };
}
