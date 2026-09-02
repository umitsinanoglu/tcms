/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents duplicate API requests and double-mount issues during development
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.watchOptions = {
        poll: 800, // Fallback polling to guarantee macOS file change detection
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.next', '**/backend/**'],
      };
    }
    return config;
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
};

module.exports = nextConfig;

