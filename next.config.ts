import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable webpack with polling for Docker/Windows file watching
  webpack: (config, { dev }) => {
    if (dev) {
      // Use polling in Docker (detected by environment or explicit flag)
      if (process.env.DOCKER || process.env.WATCHPACK_POLLING) {
        config.watchOptions = {
          poll: 500, // Check every 500ms
          aggregateTimeout: 200,
          ignored: /node_modules/,
        };
      }
    }
    return config;
  },
  // Suppress Turbopack warning when using webpack config
  turbopack: {},
};

export default nextConfig;
