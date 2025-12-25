/**
 * API Key Rotation Service
 * Manages automatic rotation of API keys for enhanced security
 */

export interface KeyRotationConfig {
  rotationPeriod: number; // days
  gracePeriod: number; // hours
  notifyBefore: number; // hours
}

export interface APIKey {
  id: string;
  key: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  rotatedAt?: Date;
}

export class APIKeyRotation {
  private config: KeyRotationConfig;
  private keys: Map<string, APIKey> = new Map();

  constructor(config: KeyRotationConfig = {
    rotationPeriod: 90,
    gracePeriod: 24,
    notifyBefore: 72,
  }) {
    this.config = config;
  }

  async generateKey(): Promise<string> {
    const buffer = new Uint8Array(32);
    crypto.getRandomValues(buffer);
    return Array.from(buffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async createKey(userId: string): Promise<APIKey> {
    const key = await this.generateKey();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.rotationPeriod * 24 * 60 * 60 * 1000);

    const apiKey: APIKey = {
      id: `key_${Date.now()}`,
      key,
      createdAt: now,
      expiresAt,
      isActive: true,
    };

    this.keys.set(apiKey.id, apiKey);
    return apiKey;
  }

  async rotateKey(keyId: string): Promise<APIKey> {
    const oldKey = this.keys.get(keyId);
    if (!oldKey) throw new Error('Key not found');

    const newKey = await this.createKey('user');
    
    oldKey.isActive = false;
    oldKey.rotatedAt = new Date();
    
    setTimeout(() => {
      this.keys.delete(keyId);
    }, this.config.gracePeriod * 60 * 60 * 1000);

    return newKey;
  }

  async scheduleRotation(keyId: string): Promise<void> {
    const key = this.keys.get(keyId);
    if (!key) throw new Error('Key not found');

    const now = new Date().getTime();
    const expiresAt = key.expiresAt.getTime();
    const notifyAt = expiresAt - (this.config.notifyBefore * 60 * 60 * 1000);

    if (now < notifyAt) {
      setTimeout(() => this.notifyRotation(keyId), notifyAt - now);
    }

    if (now < expiresAt) {
      setTimeout(() => this.rotateKey(keyId), expiresAt - now);
    }
  }

  async validateKey(key: string): Promise<boolean> {
    for (const apiKey of this.keys.values()) {
      if (apiKey.key === key && apiKey.isActive) {
        if (new Date() < apiKey.expiresAt) {
          return true;
        }
      }
    }
    return false;
  }

  private async notifyRotation(keyId: string): Promise<void> {
    console.log(`API Key ${keyId} will expire soon. Please rotate.`);
  }
}

export const keyRotation = new APIKeyRotation();
