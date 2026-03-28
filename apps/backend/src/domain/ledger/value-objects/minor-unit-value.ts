import { InvalidMinorUnitValueError } from '../errors/invalid-minor-unit-value.error';

export class MinorUnitValue {
  private readonly __type = 'minor_unit_value';
  private readonly amount: number;

  constructor(amount: number) {
    if (!Number.isInteger(amount) || amount <= 0)
      throw new InvalidMinorUnitValueError(amount);

    this.amount = amount;
  }

  static parse(value: string): MinorUnitValue {
    const parsed = parseFloat(value);

    return new MinorUnitValue(parsed);
  }

  normalize(): string {
    return this.amount.toFixed(2);
  }

  toLedgerFormat(): string {
    return this.decimalValue.toFixed(6);
  }

  get unitValue(): number {
    return this.amount;
  }

  get decimalValue(): number {
    return this.amount * 0.01;
  }
}
