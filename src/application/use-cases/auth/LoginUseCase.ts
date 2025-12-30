import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { Email } from '@/domain/value-objects/Email';
import { User } from '@/domain/entities/User';
import { LoginDTO } from '../../dto/LoginDTO';

/**
 * JWT Service interface
 */
export interface IJWTService {
  sign(payload: Record<string, unknown>, expiresIn?: string): string;
}

/**
 * Password Service interface
 */
export interface IPasswordService {
  compare(plain: string, hash: string): Promise<boolean>;
}

/**
 * Logger interface
 */
export interface ILogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

/**
 * Rate limiter interface
 */
export interface IRateLimiter {
  checkAndIncrement(key: string): Promise<{ allowed: boolean; remaining: number }>;
}

/**
 * Login result
 */
export interface LoginResult {
  token: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
  expiresIn: number;
}

/**
 * LoginUseCase - Secure authentication with protection
 * 
 * Features:
 * - Rate limiting (prevent brute force)
 * - Account lockout (after failed attempts)
 * - Audit logging
 * - Timing attack protection
 * - User status validation
 * 
 * @class LoginUseCase
 */
export class LoginUseCase {
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  private readonly JWT_EXPIRES_IN = '1h';
  private readonly failedAttempts = new Map<string, { count: number; lockedUntil?: number }>();

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: IJWTService,
    private readonly passwordService: IPasswordService,
    private readonly logger: ILogger,
    private readonly rateLimiter?: IRateLimiter
  ) {}

  /**
   * Execute login use case
   * @public
   */
  public async execute(dto: LoginDTO): Promise<LoginResult> {
    const startTime = Date.now();

    try {
      // Validate input
      this.validateInput(dto);

      // Rate limiting check
      if (this.rateLimiter) {
        await this.checkRateLimit(dto.email);
      }

      // Check account lockout
      this.checkAccountLockout(dto.email);

      // Find user
      const email = Email.create(dto.email);
      const user = await this.userRepository.findByEmail(email);

      // Timing attack protection: always compare password even if user not found
      const passwordHash = user?.getPasswordHash?.() || this.getDummyHash();
      const isPasswordValid = await this.passwordService.compare(dto.password, passwordHash);

      // Validate credentials
      if (!user || !isPasswordValid) {
        await this.handleFailedLogin(dto.email);
        this.delayResponse(startTime); // Prevent timing attacks
        throw new Error('Invalid credentials');
      }

      // Validate user status
      this.validateUserStatus(user);

      // Reset failed attempts
      this.resetFailedAttempts(dto.email);

      // Generate token
      const token = this.jwtService.sign(
        {
          userId: user.getId(),
          email: user.getEmail(),
          role: user.getRole(),
        },
        this.JWT_EXPIRES_IN
      );

      // Log successful login
      this.logger.info('User login successful', {
        userId: user.getId(),
        email: user.getEmail(),
        timestamp: new Date().toISOString(),
      });

      return {
        token,
        user: {
          id: user.getId(),
          email: user.getEmail(),
          role: user.getRole(),
        },
        expiresIn: 3600, // 1 hour in seconds
      };
    } catch (error) {
      // Log failed attempt
      this.logger.warn('Login attempt failed', {
        email: dto.email,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Validate input DTO
   * @private
   */
  private validateInput(dto: LoginDTO): void {
    if (!dto.email || typeof dto.email !== 'string') {
      throw new Error('Email is required');
    }

    if (!dto.password || typeof dto.password !== 'string') {
      throw new Error('Password is required');
    }

    if (dto.password.length < 8) {
      throw new Error('Invalid credentials');
    }
  }

  /**
   * Check rate limiting
   * @private
   */
  private async checkRateLimit(email: string): Promise<void> {
    if (!this.rateLimiter) return;

    const result = await this.rateLimiter.checkAndIncrement(`login:${email}`);
    
    if (!result.allowed) {
      this.logger.warn('Rate limit exceeded', { email });
      throw new Error('Too many login attempts. Please try again later.');
    }
  }

  /**
   * Check if account is locked
   * @private
   */
  private checkAccountLockout(email: string): void {
    const attempt = this.failedAttempts.get(email);
    
    if (attempt?.lockedUntil) {
      if (Date.now() < attempt.lockedUntil) {
        const remainingMs = attempt.lockedUntil - Date.now();
        const remainingMin = Math.ceil(remainingMs / 60000);
        
        this.logger.warn('Account locked', { email, remainingMin });
        throw new Error(`Account temporarily locked. Try again in ${remainingMin} minutes.`);
      } else {
        // Unlock account
        this.failedAttempts.delete(email);
      }
    }
  }

  /**
   * Handle failed login attempt
   * @private
   */
  private async handleFailedLogin(email: string): Promise<void> {
    const attempt = this.failedAttempts.get(email) || { count: 0 };
    attempt.count += 1;

    if (attempt.count >= this.MAX_FAILED_ATTEMPTS) {
      attempt.lockedUntil = Date.now() + this.LOCKOUT_DURATION_MS;
      
      this.logger.warn('Account locked due to failed attempts', {
        email,
        attempts: attempt.count,
      });
    }

    this.failedAttempts.set(email, attempt);
  }

  /**
   * Reset failed attempts counter
   * @private
   */
  private resetFailedAttempts(email: string): void {
    this.failedAttempts.delete(email);
  }

  /**
   * Validate user account status
   * @private
   */
  private validateUserStatus(user: User): void {
    if (!user.isActive()) {
      throw new Error('Account is inactive. Please contact support.');
    }

    // Add more status checks as needed
    // e.g., email verification, subscription status, etc.
  }

  /**
   * Get dummy hash for timing attack protection
   * @private
   */
  private getDummyHash(): string {
    // Return a valid bcrypt hash format
    return '$2b$12$' + 'x'.repeat(53);
  }

  /**
   * Delay response to prevent timing attacks
   * Ensures minimum response time
   * @private
   */
  private async delayResponse(startTime: number): Promise<void> {
    const MIN_RESPONSE_TIME = 500; // 500ms minimum
    const elapsed = Date.now() - startTime;
    
    if (elapsed < MIN_RESPONSE_TIME) {
      await new Promise(resolve => 
        setTimeout(resolve, MIN_RESPONSE_TIME - elapsed)
      );
    }
  }

  /**
   * Clean up expired lockouts (call periodically)
   * @public
   */
  public cleanupExpiredLockouts(): void {
    const now = Date.now();
    
    for (const [email, attempt] of this.failedAttempts.entries()) {
      if (attempt.lockedUntil && now >= attempt.lockedUntil) {
        this.failedAttempts.delete(email);
      }
    }
  }
}
