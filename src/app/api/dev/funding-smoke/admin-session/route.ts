import { NextRequest, NextResponse } from 'next/server';
import {
  DEV_ADMIN_BYPASS_COOKIE,
  getDevAdminBypassSecret,
} from '@/lib/dev-admin-bypass';

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const configuredSecret = getDevAdminBypassSecret();
  const providedSecret =
    request.headers.get('x-funding-smoke-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ||
    '';

  if (!configuredSecret || providedSecret !== configuredSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: DEV_ADMIN_BYPASS_COOKIE,
    value: configuredSecret,
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 60 * 30,
  });

  return response;
}
