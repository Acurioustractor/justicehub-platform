import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';

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
    "connect-src 'self' https://api.openai.com https://*.auth0.com https://*.amazonaws.com",
    "frame-src 'self' https://*.auth0.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
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

function detectSuspiciousActivity(req: NextRequest): boolean {
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

  // Block common admin/config paths
  const blockedPaths = ['/admin', '/wp-admin', '/phpmyadmin', '/.env', '/.git'];
  if (blockedPaths.some(blockedPath => path.startsWith(blockedPath))) {
    return true;
  }

  return false;
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const path = request.nextUrl.pathname;

  // Apply security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Skip middleware for static files and internal Next.js routes
  if (path.startsWith('/_next') || path.startsWith('/static') || path.includes('.') || path === '/favicon.ico') {
    return response;
  }

  // Detect suspicious activity
  if (detectSuspiciousActivity(request)) {
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
  
  // Skip authentication for public routes
  const publicPaths = ['/', '/api/health', '/_next/', '/favicon.ico', '/stories/browse', '/public/'];
  if (publicPaths.some(publicPath => path.startsWith(publicPath))) {
    return response;
  }

  try {
    let session: any;

    if (process.env.NODE_ENV === 'development') {
      console.log('DEV MODE: Bypassing authentication with mock user.');
      session = mockSession;
    } else {
      session = await getSession(request, response);
    }
    
    if (!session?.user) {
      // Redirect to login for protected routes if not in dev and no session
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.redirect(new URL('/api/auth/login', request.url));
      }
    }

    // Role-based access control for both real and mock sessions
    if (session?.user) {
      const userRole = session.user['https://justicehub.org/role'] || 'youth';
      
      // Admin routes
      if (request.nextUrl.pathname.startsWith('/admin') && userRole !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      
      // Organization admin routes
      if (request.nextUrl.pathname.startsWith('/organization') && 
          !['org_admin', 'admin'].includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      
      // Mentor routes
      if (request.nextUrl.pathname.startsWith('/mentor') && 
          !['mentor', 'org_admin', 'admin'].includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return response;
  }
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