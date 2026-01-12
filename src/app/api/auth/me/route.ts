import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      user: {
        id: 'auth0|dev-user',
        name: 'Dev User',
        email: 'dev@example.com',
        role: 'admin'
      },
      authenticated: process.env.NODE_ENV !== 'production'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
