/**
 * Email Value Object - RFC 5322 compliant
 * 
 * Enforces email validation with:
 * - RFC 5322 standard compliance
 * - Length validation (max 254 chars)
 * - Normalization (lowercase, trimmed)
 * - Domain validation
 * - Local part validation
 * - Disposable email protection (optional)
 * 
 * @class Email
 */
export class Email {
  private static readonly MAX_LENGTH = 254;
  private static readonly MAX_LOCAL_PART = 64;
  private static readonly MAX_DOMAIN_PART = 253;

  /**
   * RFC 5322 compliant regex
   * Source: https://emailregex.com/
   */
  private static readonly EMAIL_REGEX = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;

  /**
   * Common disposable email domains
   */
  private static readonly DISPOSABLE_DOMAINS = new Set([
    'tempmail.com',
    'throwaway.email',
    '10minutemail.com',
    'guerrillamail.com',
    'mailinator.com',
    'maildrop.cc',
    'temp-mail.org',
    'yopmail.com',
  ]);

  private constructor(private readonly value: string) {
    this.validate();
  }

  /**
   * Create email from string
   * @static
   * @param {string} email - Raw email string
   * @param {boolean} allowDisposable - Allow disposable email domains (default: true)
   * @returns {Email}
   */
  public static create(email: string, allowDisposable: boolean = true): Email {
    if (!email || typeof email !== 'string') {
      throw new Error('Email must be a non-empty string');
    }

    // Normalize: trim whitespace and convert to lowercase
    const normalized = email.trim().toLowerCase();

    const instance = new Email(normalized);
    
    // Check disposable if needed
    if (!allowDisposable && instance.isDisposable()) {
      throw new Error('Disposable email addresses are not allowed');
    }

    return instance;
  }

  /**
   * Validate email format and constraints
   * @private
   */
  private validate(): void {
    // Check length
    if (this.value.length > Email.MAX_LENGTH) {
      throw new Error(`Email exceeds maximum length of ${Email.MAX_LENGTH} characters`);
    }

    if (this.value.length < 3) {
      throw new Error('Email is too short');
    }

    // Check format
    if (!Email.EMAIL_REGEX.test(this.value)) {
      throw new Error(`Invalid email format: ${this.value}`);
    }

    // Split and validate parts
    const [localPart, domainPart] = this.value.split('@');

    // Validate local part
    if (!localPart || localPart.length > Email.MAX_LOCAL_PART) {
      throw new Error(`Invalid local part: maximum ${Email.MAX_LOCAL_PART} characters`);
    }

    // Validate domain part
    if (!domainPart || domainPart.length > Email.MAX_DOMAIN_PART) {
      throw new Error(`Invalid domain: maximum ${Email.MAX_DOMAIN_PART} characters`);
    }

    // Check domain has at least one dot
    if (!domainPart.includes('.')) {
      throw new Error('Invalid domain: must contain at least one dot');
    }

    // Check domain doesn't start or end with dot/hyphen
    if (domainPart.startsWith('.') || domainPart.endsWith('.') ||
        domainPart.startsWith('-') || domainPart.endsWith('-')) {
      throw new Error('Invalid domain format');
    }

    // Check for consecutive dots
    if (domainPart.includes('..')) {
      throw new Error('Invalid domain: consecutive dots not allowed');
    }
  }

  /**
   * Get email value
   * @public
   */
  public getValue(): string {
    return this.value;
  }

  /**
   * Get local part (before @)
   * @public
   */
  public getLocalPart(): string {
    return this.value.split('@')[0];
  }

  /**
   * Get domain part (after @)
   * @public
   */
  public getDomain(): string {
    return this.value.split('@')[1];
  }

  /**
   * Check if email is from disposable domain
   * @public
   */
  public isDisposable(): boolean {
    const domain = this.getDomain();
    return Email.DISPOSABLE_DOMAINS.has(domain);
  }

  /**
   * Check if email matches domain
   * @public
   */
  public hasDomain(domain: string): boolean {
    return this.getDomain() === domain.toLowerCase();
  }

  /**
   * Check equality with another Email
   * @public
   */
  public equals(other: Email | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  /**
   * Get masked email (for display)
   * Example: john.doe@example.com -> j***e@example.com
   * @public
   */
  public getMasked(): string {
    const [local, domain] = this.value.split('@');
    
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`;
    }

    const firstChar = local[0];
    const lastChar = local[local.length - 1];
    const masked = `${firstChar}***${lastChar}`;
    
    return `${masked}@${domain}`;
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
}
