import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Performance headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  
  // Cache headers for static assets
  if (request.nextUrl.pathname.startsWith('/_next/static')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }
  
  // Cache images
  if (request.nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!api).*)',
  ],
}
