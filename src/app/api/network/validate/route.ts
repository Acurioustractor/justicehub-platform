import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server-lite';

export const dynamic = 'force-dynamic';

/**
 * POST /api/network/validate
 * Submit a peer validation for another org in the network.
 * Requires authenticated session.
 *
 * GET /api/network/validate?org_id=xxx
 * Get all validations for an org (public).
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check — require a logged-in user
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required to submit validations' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fromOrgId, toOrgId, validationType, content, validatorName, validatorRole } = body;

    if (!fromOrgId || !toOrgId || !validationType || !content || !validatorName) {
      return NextResponse.json(
        { error: 'fromOrgId, toOrgId, validationType, content, and validatorName are required' },
        { status: 400 }
      );
    }

    if (fromOrgId === toOrgId) {
      return NextResponse.json({ error: 'Cannot validate yourself' }, { status: 400 });
    }

    const validTypes = ['endorsement', 'site_visit', 'collaboration', 'referral'];
    if (!validTypes.includes(validationType)) {
      return NextResponse.json(
        { error: `validationType must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = createServiceClient() as any;

    const { data, error } = await supabase
      .from('peer_validations')
      .upsert(
        {
          from_org_id: fromOrgId,
          to_org_id: toOrgId,
          validation_type: validationType,
          content: content.slice(0, 1000),
          validator_name: validatorName.slice(0, 200),
          validator_role: validatorRole?.slice(0, 200) || null,
        },
        { onConflict: 'from_org_id,to_org_id,validation_type' }
      )
      .select()
      .single();

    if (error) {
      console.error('POST /api/network/validate upsert failed:', error);
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }

    console.log(JSON.stringify({ event: 'peer_validation', fromOrgId, toOrgId, validationType }));
    return NextResponse.json({ success: true, validation: data });
  } catch (err: any) {
    console.error('POST /api/network/validate unhandled error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const orgId = request.nextUrl.searchParams.get('org_id');
  if (!orgId) {
    return NextResponse.json({ error: 'org_id required' }, { status: 400 });
  }

  try {
    const supabase = createServiceClient() as any;

    const { data: validations } = await supabase
      .from('peer_validations')
      .select(`
        id, validation_type, content, validator_name, validator_role, created_at,
        from_org:from_org_id(id, name, slug, state, is_indigenous_org)
      `)
      .eq('to_org_id', orgId)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    const { data: validationCount } = await supabase
      .from('peer_validations')
      .select('id', { count: 'exact', head: true })
      .eq('to_org_id', orgId)
      .eq('is_public', true);

    return NextResponse.json({
      orgId,
      count: validationCount?.count || (validations || []).length,
      validations: validations || [],
    });
  } catch (err) {
    console.error('GET /api/network/validate error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
