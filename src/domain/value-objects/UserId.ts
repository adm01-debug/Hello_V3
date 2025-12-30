import { randomUUID } from 'crypto';

export class UserId {
  private constructor(private readonly value: string) {
    this.validate();
  }

  public static generate(): UserId {
    return new UserId(randomUUID());
  }

  public static from(id: string): UserId {
    return new UserId(id);
  }

  private validate(): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(this.value)) {
      throw new Error(`Invalid UserId: ${this.value}`);
    }
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: UserId): boolean {
    return this.value === other.value;
  }
}
