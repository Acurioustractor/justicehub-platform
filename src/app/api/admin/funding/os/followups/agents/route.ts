import { NextResponse } from 'next/server';
import {
  fundingOsErrorResponse,
  listAssignableFundingOperatingAgents,
  requireAdminUser,
} from '@/lib/funding/funding-operating-system';

export async function GET() {
  try {
    await requireAdminUser();
    const data = await listAssignableFundingOperatingAgents();

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
