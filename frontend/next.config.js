/** @type {import('next').NextConfig} */

// Performance optimization for Phase 11-5-D
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  reactStrictMode: true,

  // ============================================
  // PHASE 11-5-D: PERFORMANCE OPTIMIZATION
  // ============================================

  // 1. Code minification (SWC)
  swcMinify: true,

  // 2. Disable source maps in production
  productionBrowserSourceMaps: false,

  // 3. Optimize fonts
  optimizeFonts: true,

  // 4. Tree-shake unused code
  experimental: {
    optimizePackageImports: ['@radix-ui', 'lucide-react', 'recharts'],
  },

  // 5. HTTP cache headers for static assets and API
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' wss: https: ws:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
          },
        ],
      },
    ];
  },

  // Skip type checking in production build - handled by CI/CD
  typescript: {
    ignoreBuildErrors: process.env.CI !== 'true',
  },
  // Skip ESLint in production build - handled by CI/CD
  eslint: {
    ignoreDuringBuilds: process.env.CI !== 'true',
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kick.com',
      },
      {
        protocol: 'https',
        hostname: '*.kick.com',
      },
      {
        protocol: 'https',
        hostname: 'twitch.tv',
      },
      {
        protocol: 'https',
        hostname: '*.twitch.tv',
      },
    ],
  },

  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
