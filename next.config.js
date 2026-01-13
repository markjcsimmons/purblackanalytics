/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable static optimization for API routes
  output: undefined, // Use default output mode
};

module.exports = nextConfig;
