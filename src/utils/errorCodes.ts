export enum ErrorCode {
  UNKNOWN = 'E0000',
  NETWORK = 'E0001',
  VALIDATION = 'E1000',
  AUTH_INVALID = 'E2000',
  AUTH_REQUIRED = 'E2001',
  NOT_FOUND = 'E3000',
  DB_ERROR = 'E4000',
}

const messages: Record<string, string> = {
  [ErrorCode.NETWORK]: 'Network error, please try again later.',
  [ErrorCode.AUTH_INVALID]: 'Invalid credentials. (Code: E2000)',
  [ErrorCode.AUTH_REQUIRED]: 'Authentication required. (Code: E2001)',
  [ErrorCode.NOT_FOUND]: 'Item not found. (Code: E3000)',
  [ErrorCode.DB_ERROR]: 'Server error. (Code: E4000)',
  [ErrorCode.VALIDATION]: 'Invalid data provided. (Code: E1000)',
};

export function getErrorMessage(code: string): string {
  return messages[code] || `Unexpected error occurred. (Code: ${code})`;
}
