export class UniqueViolationError extends Error {
  constructor(
    public column: string,
    public value: string,
    public table: string,
    public constraint: string,
  ) {
    super(`Unique constraint violation on ${column}`);
    this.name = 'UniqueViolationError';
  }
}
