import { InvalidWithdrawalValueError } from '../errors/invalid-withdrawal-value.error';

export class WithdrawalValue {
  private readonly __type = 'withdrawal';
  readonly amount: number;

  constructor(amount: number) {
    if (!Number.isInteger(amount) || amount <= 0)
      throw new InvalidWithdrawalValueError(amount);

    this.amount = amount;
  }

  toString() {
    return this.amount.toFixed(6);
  }
}
