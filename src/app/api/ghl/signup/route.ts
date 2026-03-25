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
      member_type,
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

      // Campaign member type tags
      if (member_type) {
        tags.push(GHL_TAGS.CONTAINED);
        if (member_type === 'media') tags.push(GHL_TAGS.MEDIA);
        if (member_type === 'funder') tags.push(GHL_TAGS.PARTNER);
        if (member_type === 'organization') tags.push(GHL_TAGS.WANTS_TO_HELP);
        if (member_type === 'lived_experience') tags.push(GHL_TAGS.YOUTH_VOICE);
        if (member_type === 'supporter') tags.push(GHL_TAGS.WANTS_TO_HELP);
      }

      // Steward commitments stored in custom fields (tags consolidated)
      tags.push(GHL_TAGS.JUSTICEHUB);

      // Create/update GHL contact
      ghlContactId = await ghl.upsertContact({
        email,
        name: full_name,
        tags,
        source: source || (is_steward ? 'JusticeHub Steward Signup' : 'JusticeHub Signup'),
        customFields: {
          preferred_name: preferred_name || '',
          organization: organization || '',
          signup_type: member_type || (is_steward ? 'steward' : 'user'),
          member_type: member_type || '',
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
      // Read current metadata then merge
      const { data: profile } = await (supabase as any)
        .from('public_profiles')
        .select('metadata')
        .eq('user_id', user_id)
        .single();

      if (profile) {
        await (supabase as any)
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
