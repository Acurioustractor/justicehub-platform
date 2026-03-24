import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/network/join
 *
 * Join the ALMA Network as a miner. Matches to existing org or creates a new one.
 * Auto-assigns to the appropriate state Basecamp.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orgName,
      abn,
      contactName,
      contactEmail,
      contactPhone,
      location,
      state,
      description,
      focusAreas,
      youngPeopleServed,
      isIndigenous,
    } = body;

    if (!orgName || !contactName || !contactEmail || !state) {
      return NextResponse.json(
        { error: 'Organisation name, contact name, email, and state are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient() as any;

    // Try to match to existing org
    let orgId: string | null = null;

    if (abn) {
      const { data: abnMatch } = await supabase
        .from('organizations')
        .select('id')
        .eq('abn', abn.replace(/\s/g, ''))
        .single();
      if (abnMatch) orgId = abnMatch.id;
    }

    if (!orgId) {
      const { data: nameMatch } = await supabase
        .from('organizations')
        .select('id')
        .ilike('name', orgName.trim())
        .eq('state', state)
        .single();
      if (nameMatch) orgId = nameMatch.id;
    }

    // Create org if no match
    if (!orgId) {
      const slug = orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80);

      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName.trim(),
          slug: `${slug}-${Date.now().toString(36)}`,
          abn: abn ? abn.replace(/\s/g, '') : null,
          location: location || null,
          state,
          type: 'community',
          is_indigenous_org: isIndigenous || false,
          description: description || null,
          contact_email: contactEmail,
          phone: contactPhone || null,
          is_active: true,
        })
        .select('id')
        .single();

      if (orgError) {
        return NextResponse.json(
          { error: `Failed to create organisation: ${orgError.message}` },
          { status: 500 }
        );
      }
      orgId = newOrg.id;
    }

    // Find state Basecamp
    const { data: basecamp } = await supabase
      .from('organizations')
      .select('id')
      .or('partner_tier.eq.basecamp,type.eq.basecamp')
      .eq('state', state)
      .limit(1)
      .single();

    // Check for existing membership
    const { data: existingMembership } = await supabase
      .from('network_memberships')
      .select('id, status')
      .eq('organization_id', orgId)
      .single();

    if (existingMembership) {
      return NextResponse.json({
        success: true,
        status: existingMembership.status,
        message: existingMembership.status === 'active'
          ? 'You are already part of the ALMA Network!'
          : 'Your application is being reviewed.',
        orgId,
      });
    }

    // Create membership
    const { error: memberError } = await supabase
      .from('network_memberships')
      .insert({
        organization_id: orgId,
        basecamp_id: basecamp?.id || null,
        role: 'miner',
        status: 'pending',
        contact_name: contactName.trim(),
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone || null,
        description: description || null,
        focus_areas: focusAreas || [],
        young_people_served: youngPeopleServed || null,
      });

    if (memberError) {
      return NextResponse.json(
        { error: `Failed to create membership: ${memberError.message}` },
        { status: 500 }
      );
    }

    // Sync to GHL CRM
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3004'}/api/ghl/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: contactEmail,
          full_name: contactName,
          tags: ['alma-network', 'miner', state.toLowerCase()],
          source: 'network-join',
        }),
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      status: 'pending',
      message: 'Welcome to the ALMA Network! Your application is being reviewed.',
      orgId,
      basecampName: basecamp ? 'Assigned to your state Basecamp' : 'No Basecamp in your state yet — you could be the first',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
