import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  listFundingRelationshipPathwayTasks,
  requireAdminUser,
} from '@/lib/funding/funding-operating-system';

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || 25);
    const status = String(searchParams.get('status') || 'all').trim().toLowerCase() as
      | 'all'
      | 'queued'
      | 'pending'
      | 'running'
      | 'in_progress'
      | 'completed'
      | 'failed';

    const data = await listFundingRelationshipPathwayTasks({
      limit: Number.isFinite(limit) ? limit : 25,
      status,
    });

    return NextResponse.json({ data });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
