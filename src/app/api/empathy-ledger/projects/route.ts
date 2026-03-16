import { NextRequest, NextResponse } from 'next/server';
import { getProjects, isV2Configured } from '@/lib/empathy-ledger/v2-client';

/**
 * GET /api/empathy-ledger/projects
 *
 * Fetches projects from Empathy Ledger v2 API.
 * Replaces the old syndication API proxy.
 */
export async function GET(request: NextRequest) {
  try {
    if (!isV2Configured) {
      return NextResponse.json({
        projects: [],
        unavailable_reason: 'EMPATHY_LEDGER_NOT_CONFIGURED',
      });
    }

    const result = await getProjects({ limit: 50 });

    // Map v2 response to legacy format
    const projects = result.data.map(p => ({
      id: p.id,
      name: p.name,
      code: p.code,
      description: p.description,
      location: p.location,
      status: p.status,
      start_date: p.startDate,
      end_date: p.endDate,
      storyteller_count: p.storytellerCount,
      story_count: p.storyCount,
      created_at: p.createdAt,
    }));

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('EL projects proxy error:', error);
    return NextResponse.json({ projects: [], unavailable_reason: 'EL_API_UNAVAILABLE' });
  }
}
