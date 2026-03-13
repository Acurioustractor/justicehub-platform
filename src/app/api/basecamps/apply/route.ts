import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgName, abn, contactName, contactEmail, location, state, description } = body;

    if (!orgName || !contactName || !contactEmail || !location || !state || !description) {
      return NextResponse.json({ error: 'All required fields must be provided' }, { status: 400 });
    }

    const supabase = createServiceClient() as any;

    // Create a pending organization claim tagged as a basecamp application
    // First check if org already exists by name
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .ilike('name', orgName)
      .single();

    let organizationId = existingOrg?.id;

    if (!organizationId) {
      // Create the org as pending
      const slug = orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName,
          slug,
          type: 'basecamp',
          abn: abn || null,
          location,
          state,
          description,
          verification_status: 'pending',
          partner_tier: 'basecamp',
        })
        .select('id')
        .single();

      if (orgError) {
        console.error('Failed to create org:', orgError);
        return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
      }

      organizationId = newOrg.id;
    }

    // Create the claim
    const { error: claimError } = await supabase
      .from('organization_claims')
      .insert({
        organization_id: organizationId,
        contact_name: contactName,
        contact_email: contactEmail,
        role_at_org: 'Basecamp Application',
        message: description,
        abn: abn || null,
        status: 'pending',
      });

    if (claimError) {
      console.error('Failed to create claim:', claimError);
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }

    console.log(`Basecamp application received: ${orgName} (${contactEmail})`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Basecamp apply error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
