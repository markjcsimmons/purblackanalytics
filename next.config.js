/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable Turbopack completely - it's not stable for production builds
  experimental: {
    turbo: undefined,
  },
  webpack: (config, { isServer }) => {
    return config;
  },
  // Ensure proper domain handling
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig

