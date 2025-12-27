/** @type {import('next').NextConfig} */
const nextConfig = {
  // SDK is now installed as a local file dependency, so no webpack alias needed
  // Both webpack and Turbopack can resolve it from node_modules
};

module.exports = nextConfig;

