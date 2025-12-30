import { randomUUID } from 'crypto';

/**
 * Brand type to prevent string confusion
 */
declare const __brand: unique symbol;
type Brand<T, TBrand> = T & { [__brand]: TBrand };
type UUIDString = Brand<string, 'UUID'>;

/**
 * UserId Value Object - UUID v4 only
 * 
 * Enforces:
 * - UUID v4 format validation
 * - Immutability
 * - Type safety
 * - Equality comparison
 * 
 * @class UserId
 */
export class UserId {
  /**
   * UUID v4 regex pattern
   * Specifically validates version 4 (random UUID)
   */
  private static readonly UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  /**
   * Generic UUID regex (any version)
   */
  private static readonly UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  private readonly value: UUIDString;

  private constructor(value: string) {
    this.value = value as UUIDString;
    this.validate();
  }

  /**
   * Generate new UUID v4
   * @static
   * @returns {UserId}
   */
  public static generate(): UserId {
    return new UserId(randomUUID());
  }

  /**
   * Create from existing UUID string
   * @static
   * @param {string} id - UUID string
   * @param {boolean} strictV4 - Enforce UUID v4 format (default: true)
   * @returns {UserId}
   */
  public static fromString(id: string, strictV4: boolean = true): UserId {
    if (!id || typeof id !== 'string') {
      throw new Error('UserId must be a non-empty string');
    }

    const normalized = id.trim().toLowerCase();
    const instance = new UserId(normalized);

    // Additional v4 check if strict mode
    if (strictV4 && !this.isValidV4(normalized)) {
      throw new Error('UserId must be a valid UUID v4');
    }

    return instance;
  }

  /**
   * Alias for fromString (for compatibility)
   * @static
   * @deprecated Use fromString instead
   */
  public static from(id: string): UserId {
    return this.fromString(id, false);
  }

  /**
   * Validate UUID format
   * @private
   */
  private validate(): void {
    if (!this.value) {
      throw new Error('UserId cannot be empty');
    }

    if (this.value.length !== 36) {
      throw new Error('UserId must be 36 characters long');
    }

    if (!UserId.UUID_REGEX.test(this.value)) {
      throw new Error(`Invalid UUID format: ${this.value}`);
    }
  }

  /**
   * Check if string is valid UUID v4
   * @static
   * @private
   */
  private static isValidV4(uuid: string): boolean {
    return this.UUID_V4_REGEX.test(uuid);
  }

  /**
   * Check if this is UUID v4
   * @public
   */
  public isV4(): boolean {
    return UserId.isValidV4(this.value);
  }

  /**
   * Get UUID version
   * @public
   */
  public getVersion(): number {
    const versionChar = this.value.charAt(14);
    return parseInt(versionChar, 16);
  }

  /**
   * Get raw value
   * @public
   */
  public getValue(): string {
    return this.value;
  }

  /**
   * Get short representation (first 8 chars)
   * Useful for logging/display
   * @public
   */
  public getShort(): string {
    return this.value.substring(0, 8);
  }

  /**
   * Check equality
   * @public
   */
  public equals(other: UserId | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  /**
   * Convert to string
   * @public
   */
  public toString(): string {
    return this.value;
  }

  /**
   * Convert to JSON
   * @public
   */
  public toJSON(): string {
    return this.value;
  }

  /**
   * Validate UUID string statically
   * @static
   */
  public static isValid(uuid: string, strictV4: boolean = false): boolean {
    if (!uuid || typeof uuid !== 'string') return false;
    if (uuid.length !== 36) return false;
    
    if (strictV4) {
      return this.UUID_V4_REGEX.test(uuid);
    }
    
    return this.UUID_REGEX.test(uuid);
  }
}
