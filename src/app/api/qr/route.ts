import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

const DEFAULT_SIZE = 300;
const MIN_SIZE = 64;
const MAX_SIZE = 1024;

function clampSize(value: string | null) {
  const parsed = Number.parseInt(value || '', 10);
  if (!Number.isFinite(parsed)) return DEFAULT_SIZE;
  return Math.min(Math.max(parsed, MIN_SIZE), MAX_SIZE);
}

function normalizeHex(value: string | null, fallback: string) {
  const cleaned = value?.trim().replace(/^#/, '') || fallback;
  return /^[0-9A-Fa-f]{6}$/.test(cleaned) ? `#${cleaned.toUpperCase()}` : `#${fallback}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const data = searchParams.get('data')?.trim();

  if (!data || data.length > 2048) {
    return NextResponse.json({ error: 'Invalid QR payload' }, { status: 400 });
  }

  try {
    const svg = await QRCode.toString(data, {
      type: 'svg',
      width: clampSize(searchParams.get('size')),
      margin: 1,
      color: {
        dark: normalizeHex(searchParams.get('fg'), '0A0A0A'),
        light: normalizeHex(searchParams.get('bg'), 'FFFFFF'),
      },
    });

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 });
  }
}
