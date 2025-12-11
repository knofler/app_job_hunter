import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  // Performance optimizations for development
  experimental: {
    // Disable optimizePackageImports in development to avoid issues
    // optimizePackageImports: [], // Disabled for development performance
  },

  // Suppress harmless SES lockdown warnings in development
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.devtool = 'cheap-module-source-map';
    }

    // Performance optimizations for development
    if (dev) {
      // Reduce bundle size in development
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
    }

    return config;
  },
};

export default nextConfig;