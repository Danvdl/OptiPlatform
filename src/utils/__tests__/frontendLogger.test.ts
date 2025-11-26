import { describe, test, expect, vi, beforeEach } from 'vitest';
import { logInfo, logWarning, logError } from '../frontendLogger';

describe('frontendLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('logInfo', () => {
    test('logs info message to console in development', () => {
      logInfo('Test info message');
      expect(console.log).toHaveBeenCalled();
    });

    test('logs info with additional context', () => {
      const context = { key: 'value' };
      logInfo('Info with data', context);
      expect(console.log).toHaveBeenCalled();
    });

    test('handles missing context parameter', () => {
      expect(() => logInfo('Message')).not.toThrow();
    });
  });

  describe('logWarning', () => {
    test('logs warning message to console', () => {
      logWarning('Test warning message');
      expect(console.warn).toHaveBeenCalled();
    });

    test('logs warning with additional context', () => {
      const context = { error: 'details' };
      logWarning('Warning with data', context);
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('logError', () => {
    test('logs error with Error object', () => {
      const error = new Error('Test error');
      logError(error);
      expect(console.error).toHaveBeenCalled();
    });

    test('logs error with context data', () => {
      const error = new Error('Test error');
      const context = { stack: 'trace' };
      logError(error, context);
      expect(console.error).toHaveBeenCalled();
    });

    test('handles error without message', () => {
      const error = new Error();
      expect(() => logError(error)).not.toThrow();
    });
  });

  describe('edge cases', () => {
    test('handles undefined context', () => {
      expect(() => logInfo('Message', undefined)).not.toThrow();
      expect(() => logWarning('Message', undefined)).not.toThrow();
    });

    test('handles complex objects', () => {
      const complex = { nested: { deep: { value: 123 } }, array: [1, 2, 3] };
      expect(() => logInfo('Complex object', complex)).not.toThrow();
    });

    test('handles empty strings', () => {
      expect(() => logInfo('')).not.toThrow();
      expect(() => logWarning('')).not.toThrow();
    });
  });
});
