import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(
    { ok: true, message: 'Development browser cache clear requested.' },
    {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Clear-Site-Data': '"cache"',
      },
    },
  );
}
