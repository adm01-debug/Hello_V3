import { Email } from '../value-objects/Email';
import { UserId } from '../value-objects/UserId';

/**
 * Valid user roles
 */
export type UserRole = 'user' | 'admin' | 'moderator';

/**
 * Domain event for user role changes
 */
export interface UserRoleChangedEvent {
  userId: string;
  oldRole: UserRole;
  newRole: UserRole;
  timestamp: Date;
}

/**
 * User aggregate root
 * 
 * Encapsulates user business logic and enforces invariants
 * 
 * @class User
 */
export class User {
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _role: UserRole;
  private _isActive: boolean;
  private _domainEvents: UserRoleChangedEvent[] = [];

  private constructor(
    private readonly _id: UserId,
    private readonly _email: Email,
    role: UserRole,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date
  ) {
    this._role = role;
    this._isActive = isActive;
    this._createdAt = Object.freeze(new Date(createdAt));
    this._updatedAt = new Date(updatedAt);
    
    this.validate();
  }

  /**
   * Create new user
   * @static
   */
  public static create(
    email: string,
    role: UserRole = 'user',
    isActive: boolean = true
  ): User {
    const now = new Date();
    return new User(
      UserId.generate(),
      Email.create(email),
      role,
      isActive,
      now,
      now
    );
  }

  /**
   * Reconstitute user from persistence
   * @static
   */
  public static reconstitute(
    id: string,
    email: string,
    role: UserRole,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date
  ): User {
    return new User(
      UserId.fromString(id),
      Email.create(email),
      role,
      isActive,
      createdAt,
      updatedAt
    );
  }

  /**
   * Validate user invariants
   * @private
   */
  private validate(): void {
    if (!this.isValidRole(this._role)) {
      throw new Error(`Invalid user role: ${this._role}`);
    }

    if (this._createdAt > this._updatedAt) {
      throw new Error('Created date cannot be after updated date');
    }
  }

  /**
   * Check if role is valid
   * @private
   */
  private isValidRole(role: string): role is UserRole {
    return ['user', 'admin', 'moderator'].includes(role);
  }

  /**
   * Get user ID
   * @public
   */
  public getId(): string {
    return this._id.getValue();
  }

  /**
   * Get email address
   * @public
   */
  public getEmail(): string {
    return this._email.getValue();
  }

  /**
   * Get user role
   * @public
   */
  public getRole(): UserRole {
    return this._role;
  }

  /**
   * Check if user is active
   * @public
   */
  public isActive(): boolean {
    return this._isActive;
  }

  /**
   * Check if user is admin
   * @public
   */
  public isAdmin(): boolean {
    return this._role === 'admin';
  }

  /**
   * Check if user is moderator
   * @public
   */
  public isModerator(): boolean {
    return this._role === 'moderator';
  }

  /**
   * Check if user has elevated privileges
   * @public
   */
  public hasElevatedPrivileges(): boolean {
    return this._role === 'admin' || this._role === 'moderator';
  }

  /**
   * Promote user to admin
   * @public
   */
  public promoteToAdmin(): void {
    if (this._role === 'admin') {
      throw new Error('User is already an admin');
    }

    const oldRole = this._role;
    this._role = 'admin';
    this._updatedAt = new Date();

    this.addDomainEvent({
      userId: this.getId(),
      oldRole,
      newRole: 'admin',
      timestamp: this._updatedAt,
    });
  }

  /**
   * Demote admin to user
   * @public
   */
  public demoteToUser(): void {
    if (this._role === 'user') {
      throw new Error('User is already a regular user');
    }

    const oldRole = this._role;
    this._role = 'user';
    this._updatedAt = new Date();

    this.addDomainEvent({
      userId: this.getId(),
      oldRole,
      newRole: 'user',
      timestamp: this._updatedAt,
    });
  }

  /**
   * Change role
   * @public
   */
  public changeRole(newRole: UserRole): void {
    if (!this.isValidRole(newRole)) {
      throw new Error(`Invalid role: ${newRole}`);
    }

    if (this._role === newRole) {
      return; // No change
    }

    const oldRole = this._role;
    this._role = newRole;
    this._updatedAt = new Date();

    this.addDomainEvent({
      userId: this.getId(),
      oldRole,
      newRole,
      timestamp: this._updatedAt,
    });
  }

  /**
   * Activate user account
   * @public
   */
  public activate(): void {
    if (this._isActive) {
      throw new Error('User is already active');
    }

    this._isActive = true;
    this._updatedAt = new Date();
  }

  /**
   * Deactivate user account
   * @public
   */
  public deactivate(): void {
    if (!this._isActive) {
      throw new Error('User is already inactive');
    }

    this._isActive = false;
    this._updatedAt = new Date();
  }

  /**
   * Add domain event
   * @private
   */
  private addDomainEvent(event: UserRoleChangedEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Get and clear domain events
   * @public
   */
  public getDomainEvents(): UserRoleChangedEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  /**
   * Get created date
   * @public
   */
  public getCreatedAt(): Date {
    return new Date(this._createdAt);
  }

  /**
   * Get updated date
   * @public
   */
  public getUpdatedAt(): Date {
    return new Date(this._updatedAt);
  }

  /**
   * Convert to JSON
   * @public
   */
  public toJSON() {
    return {
      id: this._id.getValue(),
      email: this._email.getValue(),
      role: this._role,
      isActive: this._isActive,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }

  /**
   * Equality comparison
   * @public
   */
  public equals(other: User): boolean {
    if (!other) return false;
    return this._id.equals(other._id);
  }
}
