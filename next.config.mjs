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
  
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  
  // Image configuration for Docker
  images: {
    domains: ['v0.blob.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Disable image optimization for Docker to avoid sharp issues
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Transpile packages
  transpilePackages: [
    'lucide-react',
  ],
  
  // Build configuration - important for Docker
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Output file tracing for standalone
  outputFileTracingIncludes: {
    '/': ['./public/**/*'],
  },
  
  // Experimental features
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Headers for security and caching
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
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  
  // Server configuration for Docker
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname
  },
  
  // Public runtime config
  publicRuntimeConfig: {
    staticFolder: '/static',
  },
}

export default nextConfig
