import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { legacyRouteMap } from './lib/navigation'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Check if this is a legacy route that needs redirecting
  if (legacyRouteMap[pathname]) {
    return NextResponse.redirect(new URL(legacyRouteMap[pathname], request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}