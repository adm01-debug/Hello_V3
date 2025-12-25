export interface JWTConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  issuer: string;
  audience: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const getConfig = (): JWTConfig => ({
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'access-secret-key-32-chars-min',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key-32-chars-min',
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  issuer: 'hello-app',
  audience: 'hello-users',
});

export class JWTHandler {
  private config: JWTConfig;
  
  constructor(config?: Partial<JWTConfig>) {
    this.config = { ...getConfig(), ...config };
  }
  
  async generateAccessToken(payload: TokenPayload): Promise<string> {
    return `access.${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
  }
  
  async generateRefreshToken(payload: TokenPayload): Promise<string> {
    return `refresh.${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
  }
  
  async generateTokens(payload: TokenPayload): Promise<Tokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(payload),
      this.generateRefreshToken(payload),
    ]);
    
    return { accessToken, refreshToken, expiresIn: this.parseExpiry(this.config.accessTokenExpiry) };
  }
  
  async verifyAccessToken(token: string): Promise<TokenPayload> {
    const parts = token.split('.');
    if (parts.length !== 2) throw new Error('Invalid token');
    return JSON.parse(Buffer.from(parts[1], 'base64').toString());
  }
  
  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    const parts = token.split('.');
    if (parts.length !== 2) throw new Error('Invalid token');
    return JSON.parse(Buffer.from(parts[1], 'base64').toString());
  }
  
  async refreshTokens(refreshToken: string): Promise<Tokens> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const { iat, exp, iss, aud, ...userPayload } = payload;
    return this.generateTokens(userPayload as TokenPayload);
  }
  
  decodeToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 2) return null;
      return JSON.parse(Buffer.from(parts[1], 'base64').toString());
    } catch {
      return null;
    }
  }
  
  isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    return Date.now() >= decoded.exp * 1000;
  }
  
  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900;
    const value = parseInt(match[1]);
    const unit = match[2];
    const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
    return value * multipliers[unit as keyof typeof multipliers];
  }
}

let jwtHandler: JWTHandler | null = null;

export const initJWT = (config?: Partial<JWTConfig>): JWTHandler => {
  jwtHandler = new JWTHandler(config);
  return jwtHandler;
};

export const getJWT = (): JWTHandler => {
  if (!jwtHandler) jwtHandler = new JWTHandler();
  return jwtHandler;
};

export const generateTokens = (payload: TokenPayload): Promise<Tokens> => getJWT().generateTokens(payload);
export const verifyAccessToken = (token: string): Promise<TokenPayload> => getJWT().verifyAccessToken(token);
export const refreshTokens = (refreshToken: string): Promise<Tokens> => getJWT().refreshTokens(refreshToken);
