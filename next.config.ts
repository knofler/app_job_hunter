import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*", // Proxy all requests starting with /api
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`, // Forward to the backend
      },
    ];
  },
};

export default nextConfig;