/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // xlsx requires this for browser builds
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      stream: false,
      buffer: false,
    };
    return config;
  },
};

module.exports = nextConfig;
