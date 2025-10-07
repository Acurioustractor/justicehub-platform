import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    user: {
      id: 'auth0|dev-user',
      name: 'Dev User',
      email: 'dev@example.com',
      role: 'admin'
    },
    authenticated: process.env.NODE_ENV !== 'production'
  });
}
