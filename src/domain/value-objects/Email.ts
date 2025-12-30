export class Email {
  private constructor(private readonly value: string) {
    this.validate();
  }

  public static create(email: string): Email {
    return new Email(email.trim().toLowerCase());
  }

  private validate(): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.value)) {
      throw new Error(`Invalid email: ${this.value}`);
    }
    if (this.value.length > 254) {
      throw new Error('Email too long');
    }
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: Email): boolean {
    return this.value === other.value;
  }
}
