const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Alias for SDK
    config.resolve.alias = {
      ...config.resolve.alias,
      '@noah-protocol/sdk': path.resolve(__dirname, '../../packages/noah-sdk/dist/index.js'),
    };
    
    // Ensure peer dependencies are resolved from the app's node_modules first
    // This prevents webpack from trying to bundle them from the SDK's dist folder
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      ...(config.resolve.modules || []),
    ];
    
    return config;
  },
  // Turbopack configuration (Next.js 16+)
  // Empty config silences the warning - webpack config will be used when --webpack flag is used
  turbopack: {},
};

module.exports = nextConfig;

