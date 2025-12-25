export class CSRFToken {
  private static readonly TOKEN_LENGTH = 32

  static generate(): string {
    const array = new Uint8Array(this.TOKEN_LENGTH)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  static validate(token: string, storedToken: string): boolean {
    return token === storedToken
  }

  static middleware() {
    return (req: any, res: any, next: any) => {
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const token = req.headers['x-csrf-token'] || req.body._csrf
        const storedToken = req.session?.csrfToken
        
        if (!token || !this.validate(token, storedToken)) {
          return res.status(403).json({ error: 'Invalid CSRF token' })
        }
      }
      next()
    }
  }
}
