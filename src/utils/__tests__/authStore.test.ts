import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { saveToken, getToken, clearToken } from '../authStore';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock frontendLogger
vi.mock('../frontendLogger', () => ({
  logWarning: vi.fn(),
  logError: vi.fn(),
}));

describe('authStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('saveToken', () => {
    test('saves token to localStorage', async () => {
      const token = 'test-jwt-token-123';
      await saveToken(token);
      
      expect(localStorage.getItem('jwt')).toBe(token);
    });

    test('overwrites existing token', async () => {
      await saveToken('old-token');
      expect(localStorage.getItem('jwt')).toBe('old-token');
      
      await saveToken('new-token');
      expect(localStorage.getItem('jwt')).toBe('new-token');
    });

    test('handles empty string token', async () => {
      await saveToken('');
      const token = await getToken();
      // Empty string may be stored or treated as null
      expect(token === '' || token === null).toBe(true);
    });

    test('handles very long token', async () => {
      const longToken = 'a'.repeat(10000);
      await saveToken(longToken);
      expect(localStorage.getItem('jwt')).toBe(longToken);
    });
  });

  describe('getToken', () => {
    test('retrieves saved token from localStorage', async () => {
      const token = 'saved-token-456';
      localStorage.setItem('jwt', token);
      
      const retrieved = await getToken();
      expect(retrieved).toBe(token);
    });

    test('returns null when no token exists', async () => {
      const token = await getToken();
      expect(token).toBeNull();
    });

    test('returns null after token is cleared', async () => {
      await saveToken('temp-token');
      expect(await getToken()).toBe('temp-token');
      
      localStorage.removeItem('jwt');
      expect(await getToken()).toBeNull();
    });
  });

  describe('clearToken', () => {
    test('removes token from localStorage', async () => {
      await saveToken('token-to-clear');
      expect(localStorage.getItem('jwt')).toBe('token-to-clear');
      
      await clearToken();
      expect(localStorage.getItem('jwt')).toBeNull();
    });

    test('does not throw error when clearing non-existent token', async () => {
      await expect(clearToken()).resolves.not.toThrow();
      expect(localStorage.getItem('jwt')).toBeNull();
    });

    test('successfully clears token multiple times', async () => {
      await saveToken('test-token');
      await clearToken();
      await clearToken();
      await clearToken();
      
      expect(localStorage.getItem('jwt')).toBeNull();
    });
  });

  describe('token lifecycle', () => {
    test('complete save-retrieve-clear cycle', async () => {
      const token = 'lifecycle-token';
      
      // Save
      await saveToken(token);
      expect(await getToken()).toBe(token);
      
      // Retrieve
      const retrieved = await getToken();
      expect(retrieved).toBe(token);
      
      // Clear
      await clearToken();
      expect(await getToken()).toBeNull();
    });

    test('handles rapid save operations', async () => {
      await saveToken('token1');
      await saveToken('token2');
      await saveToken('token3');
      
      expect(await getToken()).toBe('token3');
    });
  });

  describe('edge cases', () => {
    test('handles special characters in token', async () => {
      const specialToken = 'token!@#$%^&*()_+-={}[]|:;"<>?,./';
      await saveToken(specialToken);
      expect(await getToken()).toBe(specialToken);
    });

    test('handles unicode characters in token', async () => {
      const unicodeToken = 'token-αβγδ-emoji-🔒🔑';
      await saveToken(unicodeToken);
      expect(await getToken()).toBe(unicodeToken);
    });

    test('handles JSON-like token string', async () => {
      const jsonToken = '{"type":"Bearer","token":"abc123"}';
      await saveToken(jsonToken);
      expect(await getToken()).toBe(jsonToken);
    });
  });
});
