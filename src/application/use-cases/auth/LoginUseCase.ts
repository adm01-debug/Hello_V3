import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { Email } from '@/domain/value-objects/Email';
import { User } from '@/domain/entities/User';
import { LoginDTO } from '../dto/LoginDTO';

export interface IJWTService {
  sign(payload: Record<string, unknown>): string;
}

export interface IPasswordService {
  compare(plain: string, hash: string): Promise<boolean>;
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: IJWTService,
    private readonly passwordService: IPasswordService
  ) {}

  public async execute(dto: LoginDTO): Promise<{ token: string; user: User }> {
    const email = Email.create(dto.email);
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await this.passwordService.compare(dto.password, 'hash');

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const token = this.jwtService.sign({
      userId: user.getId(),
      email: user.getEmail(),
      role: user.getRole(),
    });

    return { token, user };
  }
}
