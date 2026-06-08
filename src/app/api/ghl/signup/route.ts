import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getGHLClient, GHL_CANONICAL, GHL_PIPELINES, MEMBER_TYPE_TO_ROLE, STATE_TO_PLACE, GHL_NURTURE_WORKFLOWS } from '@/lib/ghl/client';

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
      state,
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

    // Community lane (OCAP agency model, R3): lived-experience / youth voice are
    // NEVER auto-enrolled into comms: or nurture automation — here, in the
    // workflow trigger, or in the newsletter-list upsert below. A community-lane
    // newsletter opt-in is honored only via a human-confirmed follow-up.
    const communityLane = member_type === 'lived_experience';

    if (ghl.isConfigured()) {
      // Build canonical tags. project: is always present.
      const tags: string[] = [GHL_CANONICAL.PROJECT_JH];

      if (is_steward) {
        tags.push(GHL_CANONICAL.TIER_STEWARD);
      }

      // Campaign member type → canonical role (+ CONTAINED source, R4)
      if (member_type) {
        tags.push(GHL_CANONICAL.SOURCE_EVENT_CONTAINED);
        const roleTag = MEMBER_TYPE_TO_ROLE[member_type];
        if (roleTag) tags.push(roleTag);
        if (communityLane) {
          tags.push(GHL_CANONICAL.LANE_COMMUNITY);
        }
      }

      // State → canonical place: tag for regional segmentation
      if (state) {
        const placeTag = STATE_TO_PLACE[state.toUpperCase()];
        if (placeTag) tags.push(placeTag);
      }

      // Newsletter opt-in → comms send-trigger, UNLESS community lane (OCAP).
      if (newsletter && !communityLane) {
        tags.push(GHL_CANONICAL.COMMS_JH_NEWSLETTER);
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
          signup_type: member_type || (is_steward ? 'steward' : 'user'),
          member_type: member_type || '',
          state: state || '',
          steward_motivation: steward_motivation || '',
          steward_experience: steward_experience || '',
          steward_commitments: steward_commitments?.join(', ') || '',
          newsletter_consent: (newsletter && !communityLane) ? 'Yes' : '',
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

      // Trigger role-specific nurture workflow — NEVER for community lane (OCAP).
      if (member_type && ghlContactId && !communityLane) {
        const workflowId = GHL_NURTURE_WORKFLOWS[member_type];
        if (workflowId) {
          ghl.addToWorkflow(ghlContactId, workflowId).catch(err =>
            console.error('Failed to trigger nurture workflow:', err)
          );
        }
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

    // Newsletter list enrolment — skipped for community lane (OCAP): a
    // community-lane opt-in is honored only via a human-confirmed follow-up.
    if (newsletter && !communityLane) {
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
