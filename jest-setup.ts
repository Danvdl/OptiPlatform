import '@testing-library/jest-dom';

// Mock import.meta for Vite compatibility
(global as any).importMeta = {
  env: {
    VITE_BACKEND_URL: 'http://localhost:3001',
    DEV: false,
    PROD: true,
    MODE: 'test',
  },
};

// Make import.meta accessible
Object.defineProperty(global, 'import', {
  value: {
    meta: (global as any).importMeta,
  },
  writable: true,
});
