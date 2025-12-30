import { User } from '../entities/User';
import { Email } from '../value-objects/Email';
import { UserId } from '../value-objects/UserId';

export interface IUserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: UserId): Promise<void>;
  findAll(): Promise<User[]>;
}
