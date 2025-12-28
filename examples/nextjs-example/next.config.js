/** @type {import('next').NextConfig} */
const nextConfig = {
  // SDK is now published to npm, so no custom aliases needed
  // Add empty turbopack config to silence the error when using --webpack flag
  turbopack: {},
};

module.exports = nextConfig;

