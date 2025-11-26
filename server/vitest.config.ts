import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import swc from 'unplugin-swc';

export default defineConfig({
  plugins: [swc.vite()],
  test: {
    globals: true,
    environment: 'node',
    include: ['**/?(*.)+(spec|test).ts'],
    exclude: ['node_modules', 'dist', 'coverage'],
    setupFiles: ['./test/vitest-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.spec.ts',
        'src/**/*.test.ts',
        'src/main.ts',
        'src/**/*.module.ts',
        'src/scripts/**',
        'src/**/*.dto.ts',
        'src/**/*.input.ts',
        'src/**/*.entity.ts',
        'src/**/*.interface.ts',
      ],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50,
      },
    },
    mockReset: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      src: resolve(__dirname, './src'),
    },
  },
});
