import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: ['es2022', 'chrome89', 'firefox89', 'safari15'],
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase'],
          'tauri-vendor': ['@tauri-apps/plugin-store'],
        },
      },
    },
  },
  esbuild: {
    target: 'es2022',
  },
});
