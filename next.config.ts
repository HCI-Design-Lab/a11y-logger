import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      tailwindcss: path.resolve(__dirname, 'node_modules/tailwindcss'),
    };
    return config;
  },
};

export default nextConfig;
