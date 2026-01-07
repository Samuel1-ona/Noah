import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Support both npm package and local development
      'noah-protocol-sdk': resolve(__dirname, '../../packages/noah-sdk/dist/index.js'),
    },
  },
  server: {
    port: 5175,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
  // Allow importing JSON files
  assetsInclude: ['**/*.json'],
});

