import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginUseCase } from '../LoginUseCase';
import { User } from '@/domain/entities/User';
import { Email } from '@/domain/value-objects/Email';

describe('LoginUseCase', () => {
  let mockUserRepository: any;
  let mockJWTService: any;
  let mockPasswordService: any;
  let loginUseCase: LoginUseCase;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: vi.fn(),
    };
    mockJWTService = {
      sign: vi.fn(),
    };
    mockPasswordService = {
      compare: vi.fn(),
    };
    loginUseCase = new LoginUseCase(mockUserRepository, mockJWTService, mockPasswordService);
  });

  it('should login successfully with valid credentials', async () => {
    const user = User.create('test@example.com', 'user');
    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockPasswordService.compare.mockResolvedValue(true);
    mockJWTService.sign.mockReturnValue('token-123');

    const result = await loginUseCase.execute({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.token).toBe('token-123');
    expect(result.user).toBe(user);
  });

  it('should throw error with invalid email', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(
      loginUseCase.execute({
        email: 'invalid@example.com',
        password: 'password123',
      })
    ).rejects.toThrow('Invalid credentials');
  });

  it('should throw error with wrong password', async () => {
    const user = User.create('test@example.com', 'user');
    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockPasswordService.compare.mockResolvedValue(false);

    await expect(
      loginUseCase.execute({
        email: 'test@example.com',
        password: 'wrongpassword',
      })
    ).rejects.toThrow('Invalid credentials');
  });
});
