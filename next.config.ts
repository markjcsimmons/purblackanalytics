import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Disable static optimization for API routes
  output: undefined, // Use default output mode
};

export default nextConfig;
