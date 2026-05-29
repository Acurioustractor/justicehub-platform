import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { sanitizeEmail, sanitizeInput } from '@/lib/security';

const VALID_STATES = new Set(['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'NT', 'ACT']);
const ABN_REGEX = /^\d{11}$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgName, abn, contactName, contactEmail, location, state, description } = body;

    if (!orgName || !contactName || !contactEmail || !location || !state || !description) {
      return NextResponse.json({ error: 'All required fields must be provided' }, { status: 400 });
    }

    const sanitizedOrgName = sanitizeInput(String(orgName), { maxLength: 200, allowNewlines: false });
    const sanitizedContactName = sanitizeInput(String(contactName), { maxLength: 200, allowNewlines: false });
    const sanitizedEmail = sanitizeEmail(String(contactEmail));
    const sanitizedLocation = sanitizeInput(String(location), { maxLength: 200, allowNewlines: false });
    const sanitizedState = String(state).trim().toUpperCase();
    const sanitizedDescription = sanitizeInput(String(description), { maxLength: 2000, allowNewlines: true });
    const sanitizedAbn = abn ? String(abn).replace(/\s/g, '') : null;

    if (!sanitizedEmail) {
      return NextResponse.json({ error: 'Invalid contact email' }, { status: 400 });
    }
    if (!VALID_STATES.has(sanitizedState)) {
      return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
    }
    if (sanitizedAbn && !ABN_REGEX.test(sanitizedAbn)) {
      return NextResponse.json({ error: 'ABN must be 11 digits' }, { status: 400 });
    }

    const supabase = createServiceClient() as any;

    // First check if org already exists by name. Applications must not become
    // public basecamps until an admin has reviewed and promoted them.
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .ilike('name', sanitizedOrgName)
      .maybeSingle();

    let organizationId = existingOrg?.id;

    if (!organizationId) {
      const slug = sanitizedOrgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: sanitizedOrgName,
          slug,
          type: 'community-organization',
          abn: sanitizedAbn,
          location: sanitizedLocation,
          state: sanitizedState,
          description: sanitizedDescription,
          is_active: false,
          verification_status: 'pending',
          partner_tier: null,
        })
        .select('id')
        .single();

      if (orgError) {
        console.error('Failed to create org:', orgError);
        return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
      }

      organizationId = newOrg.id;
    }

    const { error: taskError } = await supabase
      .from('agent_task_queue')
      .insert({
        source: 'basecamp_applications',
        source_id: `basecamp-application:${organizationId}:${Date.now()}`,
        task_type: 'basecamp_application_review',
        title: `Basecamp application: ${sanitizedOrgName}`,
        description: `${sanitizedContactName} (${sanitizedEmail}) nominated ${sanitizedOrgName} in ${sanitizedLocation}, ${sanitizedState}`,
        status: 'pending',
        priority: 2,
        needs_review: true,
        output: {
          organization_id: organizationId,
          organization_name: sanitizedOrgName,
          contact_name: sanitizedContactName,
          contact_email: sanitizedEmail,
          location: sanitizedLocation,
          state: sanitizedState,
          description: sanitizedDescription,
          abn: sanitizedAbn,
          requested_partner_tier: 'basecamp',
          generated_at: new Date().toISOString(),
        },
      });

    if (taskError) {
      console.error('Failed to create basecamp application task:', taskError);
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }

    console.log(`Basecamp application received: ${sanitizedOrgName} (${sanitizedEmail})`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Basecamp apply error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
