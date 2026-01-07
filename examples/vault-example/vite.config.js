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
      // Ensure @tanstack/react-query resolves correctly
      '@tanstack/react-query': resolve(__dirname, 'node_modules/@tanstack/react-query'),
    },
  },
  server: {
    port: 5175,
    open: true,
  },
  build: {
    outDir: 'dist',
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: (id) => {
        // Don't externalize @tanstack/react-query - it should be bundled
        return false;
      },
      output: {
        manualChunks: (id) => {
          // Split vendor chunks for better caching
          if (id.includes('node_modules')) {
            // MUI components
            if (id.includes('@mui/')) {
              return 'mui';
            }
            // React Query
            if (id.includes('@tanstack/react-query')) {
              return 'react-query';
            }
            // Ethers.js
            if (id.includes('/ethers') || id.includes('\\ethers')) {
              return 'ethers';
            }
            // Everything else goes to vendor
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB
  },
  optimizeDeps: {
    include: ['@tanstack/react-query', 'react', 'react-dom'],
    exclude: [],
  },
  // Allow importing JSON files
  assetsInclude: ['**/*.json'],
});

