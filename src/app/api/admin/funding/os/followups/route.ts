import { NextRequest, NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  listFundingOperatingFollowUpTasks,
  requireAdminUser,
} from '@/lib/funding/funding-operating-system';

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();
    const url = new URL(request.url);

    const data = await listFundingOperatingFollowUpTasks({
      limit: url.searchParams.get('limit')
        ? Number(url.searchParams.get('limit'))
        : undefined,
      status:
        (url.searchParams.get('status') as
          | 'all'
          | 'queued'
          | 'pending'
          | 'running'
          | 'in_progress'
          | 'completed'
          | 'failed'
          | null) || undefined,
      reviewStatus:
        (url.searchParams.get('reviewStatus') as
          | 'all'
          | 'pending'
          | 'acknowledged'
          | 'resolved'
          | null) || undefined,
      severity:
        (url.searchParams.get('severity') as
          | 'all'
          | 'critical'
          | 'high'
          | 'medium'
          | 'low'
          | null) || undefined,
      assignment:
        (url.searchParams.get('assignment') as
          | 'all'
          | 'assigned'
          | 'unassigned'
          | null) || undefined,
      assignedAgentId: url.searchParams.get('assignedAgentId') || undefined,
      routingClass:
        (url.searchParams.get('routingClass') as
          | 'all'
          | 'pipeline'
          | 'reporting'
          | 'finance'
          | 'general'
          | null) || undefined,
    });

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    const response = fundingOsErrorResponse(error);
    return NextResponse.json({ error: response.error }, { status: response.status });
  }
}
