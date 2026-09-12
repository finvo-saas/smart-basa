/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin')

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

// Storage host that serves uploads (CDN edge, e.g. <space>.<region>.cdn.digitaloceanspaces.com)
const storageHost = process.env.NEXT_PUBLIC_STORAGE_CDN_HOST || ''

const nextConfig = {
  reactStrictMode: true,
  // Smaller production image for Docker (`next start` via standalone server.js)
  output: 'standalone',
  // Keep trailing slashes on /api/v1/* so Django POST (login, refresh) is not 500.
  skipTrailingSlashRedirect: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      // Local Django media (dev without Spaces)
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      // Spaces origin and CDN edge (the CDN host has an extra `.cdn.` label,
      // so a single-level `*.` wildcard would not match it).
      {
        protocol: 'https',
        hostname: '**.digitaloceanspaces.com',
        pathname: '/**',
      },
      ...(storageHost && !storageHost.endsWith('.digitaloceanspaces.com')
        ? [{ protocol: 'https', hostname: storageHost, pathname: '/**' }]
        : []),
    ],
  },
  async rewrites() {
    const api = (process.env.API_PROXY_TARGET || 'http://127.0.0.1:8000').replace(
      /\/$/,
      '',
    )
    return [
      {
        source: '/api/v1/:path*',
        destination: `${api}/api/v1/:path*/`,
      },
    ]
  },
  async headers() {
    return [
      {
        // The browser must recheck the worker. A cached sw.js keeps serving
        // yesterday's pages and scripts.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ]
  },
}

module.exports = withNextIntl(nextConfig)
