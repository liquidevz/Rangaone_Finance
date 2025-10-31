import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Essential for Docker deployment
  output: 'standalone',
  reactStrictMode: true,

  webpack: (config, { isServer }) => {
    // Resolve alias
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': new URL('.', import.meta.url).pathname,
    }

    // Optimize for Docker
    if (isServer) {
      config.externals.push('sharp')
    }

    return config
  },

  generateBuildId: async () => 'build-' + Date.now(),

  // Image configuration for Docker
  images: {
    domains: ['v0.blob.com', 'img.youtube.com', 'i.ytimg.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  transpilePackages: ['lucide-react'],

  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  outputFileTracingIncludes: {
    '/': ['./public/**/*'],
  },

  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
      {
        source: '/videos-for-you',
        headers: [
          { key: 'Content-Security-Policy', value: "frame-src 'self' https://www.youtube.com https://youtube.com; frame-ancestors 'self';" },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },

  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname,
  },

  publicRuntimeConfig: {
    staticFolder: '/static',
  },
}

export default nextConfig
