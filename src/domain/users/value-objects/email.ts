import { IsEmail, validateSync } from 'class-validator';
import { InvalidEmailAddressError } from '../errors/invalid-email-address.error';

export class Email {
  @IsEmail()
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
    this.validate();
  }

  private validate(): void {
    const validationErrors = validateSync(this);

    if (validationErrors.length > 0) {
      throw new InvalidEmailAddressError(this.value);
    }
  }

  static create(value: string): Email {
    return new Email(value);
  }

  getValue(): string {
    return this.value;
  }
}
