import type { NextConfig } from "next";

// PWA: @ducanh2912/next-pwa is installed in Docker. In local dev without
// the package, fall back to plain config to avoid MODULE_NOT_FOUND crashes.
let withPWA: (cfg: NextConfig) => NextConfig;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  withPWA = require("@ducanh2912/next-pwa").default({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    skipWaiting: true,
    cacheOnFrontEndNav: true,
  });
} catch {
  withPWA = (cfg: NextConfig) => cfg;
}

const nextConfig: NextConfig = {};

export default withPWA(nextConfig);