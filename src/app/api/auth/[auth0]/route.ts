import { NextRequest, NextResponse } from 'next/server';

// Completely bypass Auth0 in development
export async function GET(request: NextRequest, { params }: { params: { auth0: string } }) {
  if (process.env.NODE_ENV === 'development') {
    const { auth0 } = params;
    
    // Handle different auth routes
    if (auth0 === 'login') {
      // Set dev session and redirect to dashboard
      const response = NextResponse.redirect(new URL('/dashboard', 'http://localhost:3003'));
      response.cookies.set('dev_session', 'logged_in', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
      return response;
    }
    
    if (auth0 === 'logout') {
      // Clear session and redirect to home
      const response = NextResponse.redirect(new URL('/', 'http://localhost:3003'));
      response.cookies.delete('dev_session');
      return response;
    }
    
    if (auth0 === 'me') {
      // Return mock user data
      return NextResponse.json({
        sub: 'auth0|dev-user',
        name: 'Dev User',
        email: 'dev@example.com',
        picture: 'https://placehold.co/100x100',
        'https://justicehub.org/role': 'admin',
        'https://justicehub.org/organization_id': 'org_123_dev',
      });
    }
    
    // Default response for other auth routes
    return NextResponse.json({ message: 'Development auth bypass' });
  }
  
  // In production, use real Auth0 (this would need to be implemented)
  return NextResponse.json({ error: 'Auth0 not configured for production' }, { status: 500 });
}

export async function POST(request: NextRequest, { params }: { params: { auth0: string } }) {
  return GET(request, { params });
}