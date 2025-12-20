import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  
  // Standalone output for Docker optimization
  output: 'standalone',
  
  // Disable static optimization - force all pages to be dynamic
  // This is needed because we use React Context throughout the app
  experimental: {
    missingSuspenseWithCSRBailout: false,
    serverActions: { bodySizeLimit: '2mb' },
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
    optimizeCss: true,
    externalDir: false,
    // Turbopack configuration for faster dev builds
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Skip prerendering for error pages to avoid build failures
  generateBuildId: async () => 'build-' + Date.now(),
  
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // Image configuration for Docker
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'v0.blob.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'www.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'youtube.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
    loader: 'default',
  },

  transpilePackages: ['lucide-react'],

  typescript: { ignoreBuildErrors: true },

  // Webpack config for production builds (Turbopack is used in dev)
  webpack: (config, { dev, isServer }) => {
    // Only apply webpack configs in production builds
    if (!dev) {
      config.resolve.symlinks = false;
      
      // Production optimizations
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }
    return config;
  },

  staticPageGenerationTimeout: 120,


}

export default nextConfig
