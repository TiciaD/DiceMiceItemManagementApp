import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Ensure environment variables are available at build time
  experimental: {
    // Enable server actions if needed
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },

  // Configure environment variables
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
};

export default nextConfig;
