import { QueryFailedError } from 'typeorm';
import { PostgresError } from '../errors/postgres-error.interface';
import { UniqueViolationError } from '../errors/unique-violation.error';

const parseUniqueViolationDetail = (
  detail: string,
  constraint: string,
): { column: string; value: string } => {
  // Detail format: "Key (email)=(test@example.com) already exists."
  const match = detail.match(/Key \((.+?)\)=\((.+?)\)/);

  if (match) {
    return {
      column: match[1],
      value: match[2],
    };
  }

  // Fallback to constraint name if detail parsing fails
  // Constraint names often follow pattern: UQ_table_column
  const constraintMatch = constraint.match(/UQ_\w+_(.+)/);
  return {
    column: constraintMatch?.[1] || constraint,
    value: 'unknown',
  };
};

export const handleUniqueViolation = (error: unknown): never => {
  if (error instanceof QueryFailedError) {
    const pgError = error.driverError as PostgresError;

    // PostgreSQL unique violation code is '23505'
    if (pgError.code === '23505') {
      const { column, value } = parseUniqueViolationDetail(
        pgError.detail || '',
        pgError.constraint || '',
      );

      throw new UniqueViolationError(
        column,
        value,
        pgError.table || 'unknown',
        pgError.constraint || 'unknown',
      );
    }
  }

  throw error;
};
