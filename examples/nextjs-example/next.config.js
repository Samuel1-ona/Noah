const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force webpack usage (Turbopack doesn't handle file: dependencies well)
  // Set NEXT_PRIVATE_SKIP_TURBOPACK=1 in environment to disable Turbopack
  webpack: (config) => {
    // Alias for SDK - use absolute path as fallback
    const sdkPath = path.resolve(__dirname, '../../packages/noah-sdk/dist/index.js');
    config.resolve.alias = {
      ...config.resolve.alias,
      '@noah-protocol/sdk': sdkPath,
    };
    return config;
  },
  // Explicitly disable Turbopack in experimental config
  experimental: {
    turbo: undefined,
  },
};

module.exports = nextConfig;

