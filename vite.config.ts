/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/* 
  file summary: vite and vitest configuration file.
  responsibilities: configures react plugin and vitest test runner environment with jsdom setup.
  role in system: bundler and test configuration loaded by vite cli and vitest.
*/

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.ts',
  },
});

