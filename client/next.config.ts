import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output configuration - remove standalone for Vercel
  // output: 'standalone', // Not needed for Vercel
  
  // Specify root directory for monorepo
  outputFileTracingRoot: process.cwd(),
  
  // Environment variables (NODE_ENV is handled by Next.js automatically)
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Server external packages for Vercel functions
  serverExternalPackages: ['mongoose'],
  
  // Image optimization
  images: {
    remotePatterns: [],
    unoptimized: false,
  },
  
  // For better performance on Vercel
  poweredByHeader: false,
  compress: true,
  
  // Webpack configuration for better module resolution
  webpack: (config, { isServer }) => {
    // Ensure proper module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
};

export default nextConfig;
