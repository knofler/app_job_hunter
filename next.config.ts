import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  // Suppress harmless SES lockdown warnings in development
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.devtool = 'cheap-module-source-map';
    }
    return config;
  },
};

export default nextConfig;