import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const COOKIE = 'pitch_auth'
const GATE_PATHS = [/^\/pitch(\/|$)/]

// Faceted-navigation crawl-trap guard (2026-06-10). Bots enumerating every
// filter permutation of the matrix list pages saturated the shared database
// (each permutation is a distinct URL that renders server-side and fires
// several queries). robots.txt has the same rule, but crawlers take days to
// re-read it; this enforces it at the edge, before any database query runs.
// Real users in browsers are untouched: only known crawler user-agents with a
// query string are turned away, and the base pages stay fully crawlable.
const FACETED_PATHS = /^\/justice-matrix\/(cases|campaigns|explore)$/
const BOT_UA = /bot|crawl|spider|slurp|bingpreview|petalbot|bytespider|ahrefs|semrush|mj12|dotbot|dataforseo|gptbot|ccbot|claudebot|amazonbot|yandex/i

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  if (FACETED_PATHS.test(pathname) && search) {
    const ua = req.headers.get('user-agent') ?? ''
    if (BOT_UA.test(ua)) {
      return new NextResponse('Filtered views are not crawlable. See /robots.txt.', {
        status: 403,
        headers: { 'x-robots-tag': 'noindex, nofollow' },
      })
    }
  }

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
  matcher: ['/pitch/:path*', '/justice-matrix/cases', '/justice-matrix/campaigns', '/justice-matrix/explore'],
}
