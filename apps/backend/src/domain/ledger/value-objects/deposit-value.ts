import { InvalidDepositValueError } from '../errors/invalid-deposit-value.error';

export class DepositValue {
  private readonly __type = 'deposit';
  readonly amount: number;

  constructor(amount: number) {
    if (!Number.isInteger(amount) || amount <= 0)
      throw new InvalidDepositValueError(amount);

    this.amount = amount;
  }

  static parse(value: string): DepositValue {
    const parsed = parseInt(value);

    return new DepositValue(parsed);
  }

  toString() {
    return this.amount.toFixed(6);
  }
}
