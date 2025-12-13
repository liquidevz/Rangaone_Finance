import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Performance headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Add preload hints for critical pages on home page
  if (request.nextUrl.pathname === '/') {
    response.headers.set('Link', '</login>; rel=prefetch, </signup>; rel=prefetch, </dashboard>; rel=prefetch, </landing-page/rlogodark.png>; rel=preload; as=image, </landing-page/namelogodark.png>; rel=preload; as=image')
  }
  
  // Cache headers for static assets
  if (request.nextUrl.pathname.startsWith('/_next/static')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }
  
  // Cache images
  if (request.nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
  }

  // Cache critical pages with stale-while-revalidate for instant loading
  if (['/login', '/signup', '/dashboard'].includes(request.nextUrl.pathname)) {
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!api).*)',
  ],
}
