import * as speakeasy from 'speakeasy'
import QRCode from 'qrcode'

export class MFAService {
  static generateSecret(email: string) {
    return speakeasy.generateSecret({
      name: `Hello (${email})`,
      length: 32,
    })
  }

  static async generateQRCode(otpauthUrl: string): Promise<string> {
    return await QRCode.toDataURL(otpauthUrl)
  }

  static verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
    })
  }

  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase())
    }
    return codes
  }
}
