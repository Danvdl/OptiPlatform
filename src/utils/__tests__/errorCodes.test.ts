import { describe, test, expect } from 'vitest';
import { ErrorCode, getErrorMessage } from '../errorCodes';

describe('errorCodes', () => {
  describe('ErrorCode enum', () => {
    test('has correct error code values', () => {
      expect(ErrorCode.UNKNOWN).toBe('E0000');
      expect(ErrorCode.NETWORK).toBe('E0001');
      expect(ErrorCode.VALIDATION).toBe('E1000');
      expect(ErrorCode.AUTH_INVALID).toBe('E2000');
      expect(ErrorCode.AUTH_REQUIRED).toBe('E2001');
      expect(ErrorCode.NOT_FOUND).toBe('E3000');
      expect(ErrorCode.DB_ERROR).toBe('E4000');
    });
  });

  describe('getErrorMessage', () => {
    test('returns correct message for NETWORK error', () => {
      expect(getErrorMessage(ErrorCode.NETWORK)).toBe(
        'Network error, please try again later.'
      );
    });

    test('returns correct message for AUTH_INVALID error', () => {
      expect(getErrorMessage(ErrorCode.AUTH_INVALID)).toBe(
        'Invalid credentials. (Code: E2000)'
      );
    });

    test('returns correct message for AUTH_REQUIRED error', () => {
      expect(getErrorMessage(ErrorCode.AUTH_REQUIRED)).toBe(
        'Authentication required. (Code: E2001)'
      );
    });

    test('returns correct message for NOT_FOUND error', () => {
      expect(getErrorMessage(ErrorCode.NOT_FOUND)).toBe(
        'Item not found. (Code: E3000)'
      );
    });

    test('returns correct message for DB_ERROR error', () => {
      expect(getErrorMessage(ErrorCode.DB_ERROR)).toBe(
        'Server error. (Code: E4000)'
      );
    });

    test('returns correct message for VALIDATION error', () => {
      expect(getErrorMessage(ErrorCode.VALIDATION)).toBe(
        'Invalid data provided. (Code: E1000)'
      );
    });

    test('returns generic message for unknown error code', () => {
      const unknownCode = 'E9999';
      expect(getErrorMessage(unknownCode)).toBe(
        'Unexpected error occurred. (Code: E9999)'
      );
    });

    test('returns generic message for empty string', () => {
      expect(getErrorMessage('')).toBe(
        'Unexpected error occurred. (Code: )'
      );
    });
  });
});
