import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-api-auth';
import { resolveJudgesPostcardCards } from '@/lib/judges-postcard-source-resolver';

export async function GET() {
  try {
    const auth = await requireAdminApi();
    if ('error' in auth) return auth.error;

    const cards = await resolveJudgesPostcardCards();

    return NextResponse.json({
      success: true,
      cards,
    });
  } catch (error) {
    console.error('Judges postcard source resolver error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resolve postcard sources',
      },
      { status: 500 }
    );
  }
}
