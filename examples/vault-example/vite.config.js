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
      // Ensure @tanstack/react-query resolves to the installed package
      '@tanstack/react-query': resolve(__dirname, 'node_modules/@tanstack/react-query'),
    },
  },
  server: {
    port: 5175,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
  optimizeDeps: {
    include: ['@tanstack/react-query', 'react', 'react-dom'],
  },
  ssr: {
    noExternal: ['@tanstack/react-query'],
  },
  // Allow importing JSON files
  assetsInclude: ['**/*.json'],
});

