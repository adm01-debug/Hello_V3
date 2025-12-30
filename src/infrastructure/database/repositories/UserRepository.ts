import { Knex } from 'knex';
import { User } from '@/domain/entities/User';
import { Email } from '@/domain/value-objects/Email';
import { UserId } from '@/domain/value-objects/UserId';
import { IUserRepository } from '@/domain/repositories/IUserRepository';

/**
 * User database model
 */
interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  role: 'user' | 'admin' | 'moderator';
  is_active: boolean;
  email_verified: boolean;
  first_name?: string;
  last_name?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * UserRepository - Infrastructure layer implementation
 * 
 * Features:
 * - Transaction support
 * - Cache integration ready
 * - Soft deletes
 * - Audit logging
 * - Query optimization
 * 
 * @class UserRepository
 * @implements {IUserRepository}
 */
export class UserRepository implements IUserRepository {
  private readonly tableName = 'users';

  constructor(
    private readonly db: Knex,
    private readonly cache?: ICacheService,
    private readonly logger?: ILogger
  ) {}

  /**
   * Find user by ID
   * @public
   */
  async findById(id: UserId): Promise<User | null> {
    try {
      // Check cache first
      if (this.cache) {
        const cached = await this.cache.get(`user:${id.getValue()}`);
        if (cached) {
          this.logger?.info('User found in cache', { userId: id.getValue() });
          return this.toDomain(JSON.parse(cached));
        }
      }

      // Query database
      const row = await this.db(this.tableName)
        .where({ id: id.getValue(), is_active: true })
        .first();

      if (!row) {
        return null;
      }

      const user = this.toDomain(row);

      // Update cache
      if (this.cache) {
        await this.cache.set(
          `user:${id.getValue()}`,
          JSON.stringify(row),
          3600 // 1 hour
        );
      }

      return user;
    } catch (error) {
      this.logger?.error('Failed to find user by ID', {
        userId: id.getValue(),
        error: error instanceof Error ? error.message : 'Unknown',
      });
      throw error;
    }
  }

  /**
   * Find user by email
   * @public
   */
  async findByEmail(email: Email): Promise<User | null> {
    try {
      const row = await this.db(this.tableName)
        .where({ email: email.getValue(), is_active: true })
        .first();

      return row ? this.toDomain(row) : null;
    } catch (error) {
      this.logger?.error('Failed to find user by email', {
        email: email.getMasked(),
        error: error instanceof Error ? error.message : 'Unknown',
      });
      throw error;
    }
  }

  /**
   * Save user (create or update)
   * @public
   */
  async save(user: User): Promise<void> {
    const trx = await this.db.transaction();

    try {
      const row = this.toPersistence(user);

      const exists = await trx(this.tableName)
        .where({ id: user.getId() })
        .first();

      if (exists) {
        // Update
        await trx(this.tableName)
          .where({ id: user.getId() })
          .update({
            ...row,
            updated_at: new Date(),
          });

        this.logger?.info('User updated', { userId: user.getId() });
      } else {
        // Insert
        await trx(this.tableName).insert(row);
        this.logger?.info('User created', { userId: user.getId() });
      }

      // Invalidate cache
      if (this.cache) {
        await this.cache.delete(`user:${user.getId()}`);
      }

      // Commit transaction
      await trx.commit();

      // Publish domain events
      const events = user.getDomainEvents();
      if (events.length > 0) {
        this.logger?.info('Domain events', { count: events.length });
        // TODO: Publish to event bus
      }
    } catch (error) {
      await trx.rollback();
      
      this.logger?.error('Failed to save user', {
        userId: user.getId(),
        error: error instanceof Error ? error.message : 'Unknown',
      });
      
      throw error;
    }
  }

  /**
   * Delete user (soft delete)
   * @public
   */
  async delete(id: UserId): Promise<void> {
    try {
      await this.db(this.tableName)
        .where({ id: id.getValue() })
        .update({
          is_active: false,
          updated_at: new Date(),
        });

      // Invalidate cache
      if (this.cache) {
        await this.cache.delete(`user:${id.getValue()}`);
      }

      this.logger?.info('User deleted (soft)', { userId: id.getValue() });
    } catch (error) {
      this.logger?.error('Failed to delete user', {
        userId: id.getValue(),
        error: error instanceof Error ? error.message : 'Unknown',
      });
      throw error;
    }
  }

  /**
   * Find all users with pagination
   * @public
   */
  async findAll(
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      filters?: Partial<UserRow>;
    } = {}
  ): Promise<{ users: User[]; total: number }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const offset = (page - 1) * limit;

      let query = this.db(this.tableName).where({ is_active: true });

      // Apply filters
      if (options.filters) {
        query = query.where(options.filters);
      }

      // Count total
      const [{ count }] = await query.clone().count('* as count');
      const total = Number(count);

      // Apply sorting
      const sortBy = options.sortBy || 'created_at';
      const sortOrder = options.sortOrder || 'desc';
      query = query.orderBy(sortBy, sortOrder);

      // Apply pagination
      const rows = await query.limit(limit).offset(offset);

      const users = rows.map(row => this.toDomain(row));

      return { users, total };
    } catch (error) {
      this.logger?.error('Failed to find all users', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      throw error;
    }
  }

  /**
   * Map database row to domain entity
   * @private
   */
  private toDomain(row: UserRow): User {
    return User.reconstitute(
      row.id,
      row.email,
      row.role,
      row.is_active,
      row.created_at,
      row.updated_at
    );
  }

  /**
   * Map domain entity to database row
   * @private
   */
  private toPersistence(user: User): UserRow {
    return {
      id: user.getId(),
      email: user.getEmail(),
      password_hash: '', // TODO: Get from user entity
      role: user.getRole(),
      is_active: user.isActive(),
      email_verified: true, // TODO: Get from user entity
      created_at: user.getCreatedAt(),
      updated_at: user.getUpdatedAt(),
    };
  }
}

/**
 * Cache service interface
 */
interface ICacheService {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * Logger interface
 */
interface ILogger {
  info(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}
