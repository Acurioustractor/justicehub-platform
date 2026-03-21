import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/org/by-profile?empathy_ledger_id=xxx
 *
 * Find JusticeHub organization linked to an Empathy Ledger storyteller.
 * Looks up via public_profiles → organizations_profiles → organizations.
 */
export async function GET(request: NextRequest) {
  try {
    const elId = request.nextUrl.searchParams.get('empathy_ledger_id');
    if (!elId) {
      return NextResponse.json({ organization: null });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      return NextResponse.json({ organization: null });
    }

    const supabase = createClient(url, key);

    // Find profile by empathy_ledger_profile_id
    const { data: profile } = await supabase
      .from('public_profiles')
      .select('id')
      .eq('empathy_ledger_profile_id', elId)
      .single();

    if (!profile) {
      return NextResponse.json({ organization: null });
    }

    // Find linked organization
    const { data: link } = await supabase
      .from('organizations_profiles')
      .select('organization_id')
      .eq('profile_id', profile.id)
      .limit(1)
      .single();

    if (!link) {
      return NextResponse.json({ organization: null });
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('id', link.organization_id)
      .single();

    return NextResponse.json({ organization: org || null });
  } catch (error) {
    return NextResponse.json({ organization: null });
  }
}
