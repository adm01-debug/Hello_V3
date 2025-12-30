import { Email } from '../value-objects/Email';
import { UserId } from '../value-objects/UserId';

export class User {
  private constructor(
    private readonly id: UserId,
    private readonly email: Email,
    private role: 'user' | 'admin' | 'moderator',
    private readonly createdAt: Date
  ) {}

  public static create(email: string, role: 'user' | 'admin' | 'moderator'): User {
    return new User(UserId.generate(), Email.create(email), role, new Date());
  }

  public getId(): string {
    return this.id.getValue();
  }

  public getEmail(): string {
    return this.email.getValue();
  }

  public getRole(): string {
    return this.role;
  }

  public isAdmin(): boolean {
    return this.role === 'admin';
  }

  public promoteToAdmin(): void {
    if (this.role === 'admin') {
      throw new Error('User is already an admin');
    }
    this.role = 'admin';
  }

  public toJSON() {
    return {
      id: this.id.getValue(),
      email: this.email.getValue(),
      role: this.role,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
