import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getGHLClient, GHL_TAGS, GHL_PIPELINES } from '@/lib/ghl/client';

/**
 * POST /api/ghl/signup
 *
 * Syncs new user signups with GoHighLevel CRM
 * Called after Supabase auth user + profile creation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      email,
      full_name,
      preferred_name,
      is_steward,
      steward_motivation,
      steward_experience,
      steward_commitments,
      organization,
      newsletter,
      source,
    } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const ghl = getGHLClient();

    let ghlContactId: string | null = null;

    if (ghl.isConfigured()) {
      // Build tags array based on signup type
      const tags: string[] = [];

      if (is_steward) {
        tags.push(GHL_TAGS.STEWARD);
      }

      if (newsletter) {
        tags.push(GHL_TAGS.NEWSLETTER);
      }

      // Map steward commitments to tags
      if (steward_commitments && Array.isArray(steward_commitments)) {
        if (steward_commitments.includes('advocate')) tags.push('Steward - Advocate');
        if (steward_commitments.includes('donate')) tags.push('Steward - Donor');
        if (steward_commitments.includes('volunteer')) tags.push('Steward - Volunteer');
        if (steward_commitments.includes('share')) tags.push('Steward - Research');
        if (steward_commitments.includes('connect')) tags.push('Steward - Connector');
      }

      // Create/update GHL contact
      ghlContactId = await ghl.upsertContact({
        email,
        name: full_name,
        tags,
        source: source || (is_steward ? 'JusticeHub Steward Signup' : 'JusticeHub Signup'),
        customFields: {
          preferred_name: preferred_name || '',
          organization: organization || '',
          signup_type: is_steward ? 'steward' : 'user',
          steward_motivation: steward_motivation || '',
          steward_experience: steward_experience || '',
          steward_commitments: steward_commitments?.join(', ') || '',
        },
      });

      // If steward, add to Steward pipeline
      if (is_steward && ghlContactId && GHL_PIPELINES.STEWARD) {
        await ghl.createOpportunity({
          pipelineId: GHL_PIPELINES.STEWARD,
          pipelineStageId: process.env.GHL_STEWARD_STAGE_NEW || '',
          name: `Steward: ${full_name}`,
          contactId: ghlContactId,
        });
      }
    }

    // Update profile with GHL contact ID
    if (user_id && ghlContactId) {
      await supabase
        .from('public_profiles')
        .update({
          metadata: supabase.rpc('jsonb_set_deep', {
            target: 'metadata',
            path: '{ghl_contact_id}',
            value: `"${ghlContactId}"`,
          }),
        })
        .eq('user_id', user_id);

      // Simpler approach - just update metadata directly
      const { data: profile } = await supabase
        .from('public_profiles')
        .select('metadata')
        .eq('user_id', user_id)
        .single();

      if (profile) {
        await supabase
          .from('public_profiles')
          .update({
            metadata: {
              ...(profile.metadata || {}),
              ghl_contact_id: ghlContactId,
            },
          })
          .eq('user_id', user_id);
      }
    }

    // If newsletter opted in, add to newsletter subscriptions
    if (newsletter) {
      await supabase
        .from('newsletter_subscriptions')
        .upsert(
          {
            email,
            full_name,
            organization,
            subscription_type: is_steward ? 'steward' : 'general',
            ghl_contact_id: ghlContactId,
          },
          { onConflict: 'email' }
        );
    }

    return NextResponse.json({
      success: true,
      ghl_contact_id: ghlContactId,
      message: ghlContactId
        ? 'Synced with CRM successfully'
        : 'GHL not configured, skipped CRM sync',
    });
  } catch (error: any) {
    console.error('GHL signup sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
