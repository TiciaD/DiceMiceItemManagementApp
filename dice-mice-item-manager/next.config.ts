import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Configure external image domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        port: '',
        pathname: '/avatars/**',
      },
    ],
  },

  // Ensure environment variables are available at build time
  experimental: {
    // Enable server actions if needed
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
    // Turbopack configuration to handle LICENSE files
    turbo: {
      rules: {
        // Ignore LICENSE files to prevent parsing errors
        '**/*.{LICENSE,LICENCE}': {
          loaders: ['raw-loader'],
        },
      },
    },
  },

  // Configure environment variables
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },

  // Webpack configuration for fallback when not using Turbopack
  webpack: (config) => {
    // Ignore LICENSE files in webpack builds
    config.module.rules.push({
      test: /\/(LICENSE|LICENCE)$/,
      use: 'raw-loader',
    });

    return config;
  },
};

export default nextConfig;
