import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8001/api/:path*',
      },
    ];
  },
  trailingSlash: false,
  output: 'standalone', // Recommended for production with systemd
};

export default nextConfig;
