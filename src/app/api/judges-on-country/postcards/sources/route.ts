import { NextResponse } from 'next/server';
import { resolveJudgesPostcardCards } from '@/lib/judges-postcard-source-resolver';

export async function GET() {
  try {
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
