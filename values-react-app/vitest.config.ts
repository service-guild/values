import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Import react plugin

// No longer merging viteConfig, define everything needed for tests here
export default defineConfig({
  plugins: [react()], // Include react plugin directly
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // Optionally include CSS processing if needed for tests
    // css: true,
  },
});
