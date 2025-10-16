import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output configuration for Vercel
  output: 'standalone',
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // API routes configuration
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? '/api/:path*' 
          : 'http://localhost:5000/api/:path*'
      },
      {
        source: '/health',
        destination: process.env.NODE_ENV === 'production'
          ? '/health'
          : 'http://localhost:5000/health'
      }
    ];
  },
  
  // Headers for CORS and security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
  
  // Experimental features
  experimental: {
    serverComponentsExternalPackages: ['mongoose']
  },
  
  // Image domains if needed
  images: {
    domains: [],
    remotePatterns: []
  }
};

export default nextConfig;
