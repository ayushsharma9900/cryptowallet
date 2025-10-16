// Root-level Next.js config for Vercel deployment
// Redirects to the actual client configuration

const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Point to the client directory
  distDir: './client/.next',
  
  // Experimental monorepo support
  experimental: {
    outputFileTracingRoot: path.join(__dirname, './'),
  },
};

module.exports = nextConfig;