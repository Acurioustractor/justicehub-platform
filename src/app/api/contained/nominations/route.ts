import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getGHLClient, GHL_TAGS } from '@/lib/ghl/client';
import { sanitizeEmail, sanitizeInput } from '@/lib/security';
import { sendEmail } from '@/lib/email/send';

const SITE = 'https://justicehub.com.au';

/**
 * POST /api/contained/nominations
 *
 * Accepts nominations for THE CONTAINED experience.
 * Saves to campaign_alignment_entities, syncs nominator to GHL, sends confirmation email.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nominee_name,
      nominee_role,
      nominee_organization,
      category,
      nominator_name,
      nominator_email,
      reason,
    } = body;

    // Validate required fields
    if (!nominee_name || !nominator_email || !nominator_name) {
      return NextResponse.json(
        { error: 'Nominee name, nominator name, and nominator email are required' },
        { status: 400 }
      );
    }

    const email = sanitizeEmail(nominator_email);
    if (!email) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const sanitizedNomineeName = sanitizeInput(String(nominee_name), { maxLength: 200, allowNewlines: false });
    const sanitizedNomineeRole = nominee_role ? sanitizeInput(String(nominee_role), { maxLength: 200, allowNewlines: false }) : null;
    const sanitizedNomineeOrg = nominee_organization ? sanitizeInput(String(nominee_organization), { maxLength: 200, allowNewlines: false }) : null;
    const sanitizedCategory = category ? sanitizeInput(String(category), { maxLength: 100, allowNewlines: false }) : 'decision-maker';
    const sanitizedNominatorName = sanitizeInput(String(nominator_name), { maxLength: 200, allowNewlines: false });
    const sanitizedReason = reason ? sanitizeInput(String(reason), { maxLength: 2000 }) : null;

    const supabase = createServiceClient();

    // Save nomination to campaign_alignment_entities (maps to actual schema columns)
    const { data: nomination, error: insertError }: { data: any; error: any } = await (supabase as any)
      .from('campaign_alignment_entities')
      .insert({
        name: sanitizedNomineeName,
        entity_type: 'individual',
        position: sanitizedNomineeRole,
        organization: sanitizedNomineeOrg,
        alignment_category: sanitizedCategory,
        email: email,
        outreach_status: 'nominated',
        alignment_signals: {
          nominator_name: sanitizedNominatorName,
          nominator_email: email,
          reason: sanitizedReason,
          nomination_type: 'contained_experience',
          nominated_at: new Date().toISOString(),
        },
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Nomination insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save nomination' }, { status: 500 });
    }

    // Sync nominator to GHL
    const ghl = getGHLClient();
    if (ghl.isConfigured()) {
      ghl.upsertContact({
        email,
        name: sanitizedNominatorName,
        tags: [GHL_TAGS.CONTAINED_NOMINATOR, GHL_TAGS.SEEDS_JUSTICEHUB],
        source: 'JusticeHub CONTAINED Nomination',
        customFields: {
          nominated_person: sanitizedNomineeName,
          nomination_category: sanitizedCategory,
        },
      }).catch(err => console.error('GHL sync error (nomination):', err));
    }

    // Send confirmation email to nominator
    await sendEmail({
      to: email,
      subject: 'Your nomination has been received',
      preheader: `You nominated ${sanitizedNomineeName} for THE CONTAINED experience.`,
      body: `Thank you, ${sanitizedNominatorName}.

Your nomination has been received.

You nominated ${sanitizedNomineeName}${sanitizedNomineeOrg ? ` (${sanitizedNomineeOrg})` : ''} to experience THE CONTAINED.

${sanitizedReason ? `Your reason: "${sanitizedReason}"` : ''}

WHAT HAPPENS NEXT
Our team reviews every nomination. When THE CONTAINED arrives in their city, we'll reach out to the nominee with a personal invitation, backed by your endorsement.

The more people who nominate the same leader, the harder it is to ignore.

Share the nomination link: ${SITE}/contained#nominate

— The JusticeHub Team`,
    });

    return NextResponse.json({
      success: true,
      nomination_id: nomination?.id,
    });
  } catch (error: any) {
    console.error('Nomination error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
