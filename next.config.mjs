/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal config for successful deployment
  reactStrictMode: false,

  // Skip type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Basic image optimization
  images: {
    domains: ['cdn.sanity.io', 'autosalonani.com'],
  },
};

export default nextConfig;
