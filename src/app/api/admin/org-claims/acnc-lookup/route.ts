import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/supabase/admin-lite';

const ABN_REGEX = /^\d{11}$/;

export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const abn = request.nextUrl.searchParams.get('abn')?.replace(/\s/g, '');
    if (!abn || !ABN_REGEX.test(abn)) {
      return NextResponse.json({ error: 'Valid 11-digit ABN is required' }, { status: 400 });
    }

    const response = await fetch(
      `https://grantscope.vercel.app/api/charities/claim/${abn}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'ABN not found in ACNC registry' }, { status: 404 });
      }
      throw new Error(`GrantScope API returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ acnc: data });
  } catch (error) {
    console.error('Error looking up ABN:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
