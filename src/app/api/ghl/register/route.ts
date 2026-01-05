import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getGHLClient, GHL_TAGS } from '@/lib/ghl/client';

/**
 * POST /api/ghl/register
 *
 * Registers a user for an event and syncs with GoHighLevel CRM
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      event_id,
      email,
      full_name,
      organization,
      role,
      dietary_requirements,
      accessibility_needs,
      how_heard,
      newsletter,
      event_name,
    } = body;

    // Validate required fields
    if (!email || !full_name) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const ghl = getGHLClient();

    // 1. Create/update GHL contact
    let ghlContactId: string | null = null;

    if (ghl.isConfigured()) {
      const tags = [GHL_TAGS.EVENT_REGISTRANT];

      // Add event-specific tag if it's the CONTAINED launch
      if (event_name?.includes('CONTAINED')) {
        tags.push(GHL_TAGS.CONTAINED_LAUNCH);
      }

      if (newsletter) {
        tags.push(GHL_TAGS.NEWSLETTER);
      }

      // Map role to tag
      if (role === 'researcher') tags.push(GHL_TAGS.RESEARCHER);
      if (role === 'practitioner') tags.push(GHL_TAGS.PRACTITIONER);
      if (role === 'lived_experience') tags.push(GHL_TAGS.YOUTH_VOICE);

      ghlContactId = await ghl.upsertContact({
        email,
        name: full_name,
        tags,
        source: 'JusticeHub Event Registration',
        customFields: {
          organization: organization || '',
          role: role || '',
          how_heard: how_heard || '',
        },
      });
    }

    // 2. Save registration to database
    const { data: registration, error: regError } = await supabase
      .from('event_registrations')
      .insert({
        event_id: event_id || null,
        email,
        full_name,
        organization: organization || null,
        ghl_contact_id: ghlContactId,
        metadata: {
          role,
          dietary_requirements,
          accessibility_needs,
          how_heard,
          newsletter,
          event_name,
          registered_at: new Date().toISOString(),
        },
        registration_status: 'registered',
      })
      .select()
      .single();

    if (regError) {
      console.error('Registration error:', regError);
      return NextResponse.json(
        { error: 'Failed to save registration' },
        { status: 500 }
      );
    }

    // 3. If newsletter opted in, also add to newsletter subscriptions
    if (newsletter) {
      await supabase
        .from('newsletter_subscriptions')
        .upsert(
          {
            email,
            full_name,
            organization,
            subscription_type: role === 'researcher' ? 'researcher' : 'general',
            ghl_contact_id: ghlContactId,
            source: 'event_registration',
          },
          { onConflict: 'email' }
        );
    }

    return NextResponse.json({
      success: true,
      registration_id: registration.id,
      ghl_contact_id: ghlContactId,
    });
  } catch (error: any) {
    console.error('GHL register error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
