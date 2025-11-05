import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Add a mock session for development
const mockSession = {
  user: {
    sub: 'auth0|dev-user',
    name: 'Dev User',
    email: 'dev@example.com',
    picture: 'https://placehold.co/100x100',
    'https://justicehub.org/role': 'admin',
    'https://justicehub.org/organization_id': 'org_123_dev',
  },
  accessToken: 'mock_access_token',
  idToken: 'mock_id_token',
  token_type: 'Bearer',
  expires_at: Math.floor(Date.now() / 1000) + 3600,
};

// Security headers
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'X-XSS-Protection': '1; mode=block',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.auth0.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' blob:",
    [
      "connect-src 'self'",
      'https://api.openai.com',
      'https://*.auth0.com',
      'https://*.amazonaws.com',
      'https://*.supabase.co',
      'https://basemaps.cartocdn.com',
      'https://tiles.basemaps.cartocdn.com',
      'https://*.basemaps.cartocdn.com',
      'https://demotiles.maplibre.org',
      'https://tile.openstreetmap.org',
      'https://*.tile.openstreetmap.org',
      'blob:',
      'data:'
    ].join(' '),
    "frame-src 'self' https://*.auth0.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "upgrade-insecure-requests"
  ].join('; ')
};

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

function getClientIdentifier(req: NextRequest): string {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || req.ip || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  return `${ip}:${userAgent.slice(0, 50)}`;
}

function detectSuspiciousActivity(req: NextRequest, isAdminUser: boolean = false): boolean {
  const userAgent = req.headers.get('user-agent') || '';
  const path = req.nextUrl.pathname;

  // Common attack patterns
  const suspiciousPatterns = [
    /sqlmap/i, /nikto/i, /nmap/i, /burp/i,
    /\.\./,  // Path traversal
    /union.*select/i, // SQL injection
    /<script/i, // XSS
    /javascript:/i, /vbscript:/i,
    /onload=/i, /onerror=/i,
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(userAgent) || pattern.test(path))) {
    return true;
  }

  // Block common admin/config paths (but allow /admin for authenticated admins)
  const blockedPaths = ['/wp-admin', '/phpmyadmin', '/.env', '/.git'];
  if (blockedPaths.some(blockedPath => path.startsWith(blockedPath))) {
    return true;
  }

  // Block /admin paths only for non-admin users
  if (path.startsWith('/admin') && !isAdminUser) {
    return true;
  }

  return false;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next();
  const path = request.nextUrl.pathname;

  // Skip middleware for static files and internal Next.js routes early
  if (path.startsWith('/_next') || path.startsWith('/static') || path.includes('.') || path === '/favicon.ico') {
    return response;
  }

  // Apply security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Redirect old blog routes to stories routes (consolidate to one system)
  if (path.startsWith('/admin/blog')) {
    const newPath = path.replace('/admin/blog', '/admin/stories');
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  // Public routes that don't need Supabase auth
  const publicRoutes = ['/wiki', '/preplanning', '/', '/stories', '/community-programs', '/organizations'];
  const isPublicRoute = publicRoutes.some(route => path === route || path.startsWith(`${route}/`));

  // Only create Supabase client if we have environment variables and not on a fully public route
  let user = null;
  let isAdminUser = false;

  if (!isPublicRoute) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        // Create Supabase client for middleware (handles auth cookie refresh)
        const supabase = createServerClient(
          supabaseUrl,
          supabaseKey,
          {
            cookies: {
              getAll() {
                const cookies = request.cookies.getAll()
                console.log('🍪 Middleware cookies:', cookies.map(c => c.name).join(', '))
                return cookies
              },
              setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => {
                  request.cookies.set(name, value)
                })
                response = NextResponse.next({
                  request,
                })
                cookiesToSet.forEach(({ name, value, options }) => {
                  response.cookies.set(name, value, options)
                })
              },
            },
          }
        );

        // Refresh session if expired - this is crucial!
        const { data: { user: authUser }, error } = await supabase.auth.getUser();
        user = authUser;
        console.log('🔐 Middleware auth check:', user ? `User: ${user.email}` : `No user (${error?.message})`);

        // Check if user is admin (for /admin path protection)
        if (user && path.startsWith('/admin')) {
          const { data: userData } = await supabase
            .from('users')
            .select('user_role')
            .eq('id', user.id)
            .single();

          isAdminUser = userData?.user_role === 'admin';
          console.log('🔑 Admin check for /admin path:', { userId: user.id, isAdmin: isAdminUser });
        }
      } catch (error) {
        console.error('Middleware Supabase error:', error);
        // Continue without auth - don't crash the middleware
      }
    }
  }

  // Detect suspicious activity
  if (detectSuspiciousActivity(request, isAdminUser)) {
    console.warn('Suspicious activity detected:', {
      ip: request.headers.get('x-forwarded-for') || request.ip,
      userAgent: request.headers.get('user-agent'),
      path: request.nextUrl.pathname,
      timestamp: new Date().toISOString()
    });
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Rate limiting for API routes
  if (path.startsWith('/api/')) {
    const clientId = getClientIdentifier(request);
    const rateLimitKey = `${clientId}:${path}`;
    
    // Different limits for different endpoints
    const limit = path.includes('/upload') ? 10 : path.includes('/auth') ? 5 : 100;
    
    if (!checkRateLimit(rateLimitKey, limit, 60000)) {
      return new NextResponse(JSON.stringify({ error: 'Rate limit exceeded' }), { 
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '60' }
      });
    }
  }
  
  // Most routes are public - no auth required
  // Protected routes can handle auth in their own page components
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (Auth0 routes)
     * - api/health (health check)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|api/health|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
