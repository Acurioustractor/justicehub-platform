import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkOrgAccess } from '@/lib/org-hub/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const orgId = params.orgId;
    if (!await checkOrgAccess(supabase, user.id, orgId))
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    // Fetch programs from the programs_catalog_v view
    const { data, error } = await supabase
      .from('programs_catalog_v')
      .select('id, name, description, approach, impact_summary, success_rate, participants_served, tags')
      .eq('organization_id', orgId)
      .order('name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function asOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((tag) => asText(tag)).filter(Boolean);
  }

  return asText(value)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const orgId = params.orgId;
    if (!await checkOrgAccess(supabase, user.id, orgId)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const name = asText(body.name);
    const description = asText(body.description);
    const location = asText(body.location);
    const state = asText(body.state);
    const approach = asText(body.approach) || 'community-led';
    const impactSummary = asText(body.impact_summary) || description;

    if (!name) {
      return NextResponse.json({ error: 'Program name is required' }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ error: 'Program description is required' }, { status: 400 });
    }

    const serviceClient = createServiceClient() as any;
    const { data: org } = await serviceClient
      .from('organizations')
      .select('id, name, location, state, website')
      .eq('id', orgId)
      .single();

    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

    const { data, error } = await serviceClient
      .from('registered_services')
      .insert({
        organization_id: orgId,
        organization: org.name,
        name,
        description,
        impact_summary: impactSummary,
        approach,
        location: location || org.location || 'Not recorded',
        state: state || org.state || 'National',
        website: asText(body.website) || org.website || null,
        participants_served: asOptionalNumber(body.participants_served),
        success_rate: asOptionalNumber(body.success_rate),
        tags: asTags(body.tags),
        is_verified: false,
        is_featured: false,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .select('id, name')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
