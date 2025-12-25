import * as speakeasy from 'speakeasy'

export class TOTPGenerator {
  static generate(secret: string): string {
    return speakeasy.totp({
      secret,
      encoding: 'base32',
    })
  }

  static getTimeRemaining(): number {
    return 30 - (Math.floor(Date.now() / 1000) % 30)
  }
}
