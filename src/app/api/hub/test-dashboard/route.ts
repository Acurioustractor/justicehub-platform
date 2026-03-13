import { NextResponse } from 'next/server';
import { getThisWeekSummary } from '@/lib/bgfit/queries';

const BG_FIT_ORG_ID = '11111111-1111-1111-1111-111111111004';

// Temporary test endpoint — no auth, returns dashboard JSON
// DELETE THIS FILE after testing
export async function GET() {
  try {
    const summary = await getThisWeekSummary(BG_FIT_ORG_ID);
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
