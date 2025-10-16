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
  serverExternalPackages: ['mongoose', 'bcryptjs', 'jsonwebtoken'],
  
  // Image optimization
  images: {
    remotePatterns: [],
    unoptimized: false,
  },
  
  // For better performance on Vercel
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
