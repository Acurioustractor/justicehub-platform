import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { getEntityEnrichment } from '@/lib/grantscope/entity-enrichment';

export const dynamic = 'force-dynamic';

/**
 * GET /api/organizations/[id]/enrichment
 *
 * Returns GrantScope entity enrichment data for a JH organization.
 * Looks up the org's gs_entity_id and fetches enrichment from the GS entity graph.
 * Returns null enrichment for unlinked orgs (graceful degradation).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient() as any;

    // Look up org by ID or slug
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );

    const { data: org, error } = await supabase
      .from('organizations')
      .select('id, name, gs_entity_id')
      .eq(isUUID ? 'id' : 'slug', id)
      .single();

    if (error || !org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 },
      );
    }

    if (!org.gs_entity_id) {
      return NextResponse.json({
        organizationId: org.id,
        organizationName: org.name,
        linked: false,
        enrichment: null,
      });
    }

    const enrichment = await getEntityEnrichment(org.gs_entity_id);

    return NextResponse.json({
      organizationId: org.id,
      organizationName: org.name,
      linked: true,
      enrichment,
    });
  } catch (err) {
    console.error('Enrichment fetch error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
