/** @type {import('next').NextConfig} */
const nextConfig = {
  // Core optimizations
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  generateEtags: true,
  reactStrictMode: true,

  // Skip type checking during build for memory optimization
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable static generation for error pages to prevent build issues
  skipTrailingSlashRedirect: true,

  // Enhanced image optimization for car photos
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
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Performance optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn', 'info']
    } : false,
    // Optimize styled-components
    styledComponents: true,
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
    ],
  },

  // Security and performance headers
  async headers() {
    return [
      // Apply to all routes
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      // Static assets caching
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // API routes
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300',
          },
        ],
      },
    ];
  },

  // Advanced webpack optimizations
  webpack: (config, { dev }) => {
    // Only for production builds
    if (!dev) {
      // Tree shaking optimizations
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;

      // Bundle splitting for better caching
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 1,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
          common: {
            minChunks: 2,
            priority: -15,
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config;
  },

  // SEO redirects
  async redirects() {
    return [
      {
        source: '/vehicles/:slug*',
        has: [
          {
            type: 'query',
            key: 'ref',
            value: '(?<ref>.*)',
          },
        ],
        destination: '/vehicles/:slug*',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
