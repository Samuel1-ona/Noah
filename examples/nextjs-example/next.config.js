const path = require('path');
const fs = require('fs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Alias for SDK - use absolute path
    const sdkPath = path.resolve(__dirname, '../../packages/noah-sdk/dist/index.js');
    const sdkExists = fs.existsSync(sdkPath);
    
    if (!sdkExists) {
      console.warn(`⚠️  SDK not found at ${sdkPath}. Make sure to run 'npm run prebuild' first.`);
    }
    
    config.resolve.alias = {
      ...config.resolve.alias,
      '@noah-protocol/sdk': sdkPath,
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

