import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { User } from '@/domain/entities/User';
import { Email } from '@/domain/value-objects/Email';
import { UserId } from '@/domain/value-objects/UserId';

export class PostgresUserRepository implements IUserRepository {
  constructor(private readonly db: any) {}

  public async findById(id: UserId): Promise<User | null> {
    const result = await this.db.query('SELECT * FROM users WHERE id = $1', [id.getValue()]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  public async findByEmail(email: Email): Promise<User | null> {
    const result = await this.db.query('SELECT * FROM users WHERE email = $1', [email.getValue()]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  public async save(user: User): Promise<void> {
    const json = user.toJSON();
    await this.db.query(
      'INSERT INTO users (id, email, role, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET email = $2, role = $3',
      [json.id, json.email, json.role, json.createdAt]
    );
  }

  public async delete(id: UserId): Promise<void> {
    await this.db.query('DELETE FROM users WHERE id = $1', [id.getValue()]);
  }

  public async findAll(): Promise<User[]> {
    const result = await this.db.query('SELECT * FROM users');
    return result.rows.map((row: any) => this.mapToEntity(row));
  }

  private mapToEntity(row: any): User {
    return User.create(row.email, row.role);
  }
}
