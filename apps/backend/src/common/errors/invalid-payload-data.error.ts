export interface PayloadDataErrors {
  [key: string]: string[] | undefined;
}

export class InvalidPayloadDataError extends Error {
  constructor(readonly data: PayloadDataErrors) {
    super('Invalid payload data');
  }
}
