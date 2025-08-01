export enum ErrorCode {
  UNKNOWN = 'E0000',
  NETWORK = 'E0001',
  VALIDATION = 'E1000',
  AUTH_INVALID = 'E2000',
  AUTH_REQUIRED = 'E2001',
  NOT_FOUND = 'E3000',
  DB_ERROR = 'E4000',
}

export class AppError extends Error {
  constructor(public code: ErrorCode, message: string) {
    super(message);
  }
}
