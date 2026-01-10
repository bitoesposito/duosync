import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker (only in production)
  ...(process.env.NODE_ENV === "production" && { output: "standalone" }),
  // Configure webpack for file watching in Docker (polling mode)
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300, // Delay before rebuilding once the first file changed
      };
    }
    
    return config;
  },
  // Add empty turbopack config to silence Next.js 16 warning when using webpack
  turbopack: {},
};

export default nextConfig;
