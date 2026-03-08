import { InvalidPasswordError } from '../errors/invalid-password.error';

export class Password {
  private static readonly MIN_LENGTH = 8;
  private static readonly UPPERCASE_PATTERN = /(?=.*[A-Z])/;
  private static readonly LOWERCASE_PATTERN = /(?=.*[a-z])/;
  private static readonly NUMBER_PATTERN = /(?=.*\d)/;
  private static readonly SPECIAL_CHAR_PATTERN = /(?=.*[!@#$%^&*(),.?":{}|<>])/;
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
    this.validate();
  }

  private validate(): void {
    const errors: string[] = [];

    if (this.value.length < Password.MIN_LENGTH) {
      errors.push(`Must be at least ${Password.MIN_LENGTH} characters`);
    }
    if (!Password.UPPERCASE_PATTERN.test(this.value)) {
      errors.push('Must contain at least one uppercase letter');
    }
    if (!Password.LOWERCASE_PATTERN.test(this.value)) {
      errors.push('Must contain at least one lowercase letter');
    }
    if (!Password.NUMBER_PATTERN.test(this.value)) {
      errors.push('Must contain at least one number');
    }
    if (!Password.SPECIAL_CHAR_PATTERN.test(this.value)) {
      errors.push('Must contain at least one special character');
    }

    if (errors.length > 0) {
      throw new InvalidPasswordError(errors);
    }
  }

  getValue(): string {
    return this.value;
  }

  static create(value: string): Password {
    return new Password(value);
  }
}
