import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Basic optimizations
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  generateEtags: true,
  reactStrictMode: true,

  // Image optimization for car photos
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.sanity.io", // For Sanity CMS images
      },
      {
        protocol: "https",
        hostname: "autosalonani.com",
      },
      {
        protocol: "https",
        hostname: "*.cloudinary.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000, // 1 year cache
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;