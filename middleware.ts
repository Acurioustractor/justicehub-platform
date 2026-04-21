import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const COOKIE = 'pitch_auth'
const GATE_PATHS = [/^\/pitch(\/|$)/]

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  if (!GATE_PATHS.some((re) => re.test(pathname))) return NextResponse.next()
  if (pathname === '/pitch/login' || pathname.startsWith('/api/pitch/')) {
    return NextResponse.next()
  }

  const token = req.cookies.get(COOKIE)?.value
  const expected = process.env.PITCH_SHARED_TOKEN
  if (expected && token === expected) return NextResponse.next()

  const login = req.nextUrl.clone()
  login.pathname = '/pitch/login'
  login.search = `?next=${encodeURIComponent(pathname + search)}`
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ['/pitch/:path*'],
}
